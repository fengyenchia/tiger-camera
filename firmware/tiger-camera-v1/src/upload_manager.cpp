#include "upload_manager.h"

#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <cstring>
#include "esp_heap_caps.h"
#include "esp_system.h"

#include "app_config.h"
#include "device_config.h"
#include "network_manager.h"
#include "r2_root_ca.h"

namespace {

bool extractJsonString(const String& json, const char* key, String* output) {
  const String marker = String('"') + key + '"';
  int cursor = json.indexOf(marker);
  if (cursor < 0) return false;
  cursor = json.indexOf(':', cursor + marker.length());
  if (cursor < 0) return false;
  cursor = json.indexOf('"', cursor + 1);
  if (cursor < 0) return false;

  String result;
  bool escaped = false;
  for (int index = cursor + 1; index < static_cast<int>(json.length()); ++index) {
    const char value = json[index];
    if (escaped) {
      switch (value) {
        case 'n': result += '\n'; break;
        case 'r': result += '\r'; break;
        case 't': result += '\t'; break;
        default: result += value; break;
      }
      escaped = false;
      continue;
    }
    if (value == '\\') {
      escaped = true;
      continue;
    }
    if (value == '"') {
      *output = result;
      return true;
    }
    result += value;
  }
  return false;
}

void makeUuid(char output[37]) {
  uint8_t bytes[16];
  esp_fill_random(bytes, sizeof(bytes));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  snprintf(output, 37,
           "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
           bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5],
           bytes[6], bytes[7], bytes[8], bytes[9], bytes[10], bytes[11],
           bytes[12], bytes[13], bytes[14], bytes[15]);
}

String endpoint(const char* path) {
  String url(apiBaseUrl);
  while (url.endsWith("/")) url.remove(url.length() - 1);
  url += path;
  return url;
}

void configureHttp(HTTPClient* http) {
  http->setConnectTimeout(AppConfig::httpConnectTimeoutMs);
  http->setTimeout(AppConfig::httpRequestTimeoutMs);
}

bool beginSecureRequest(HTTPClient* http, WiFiClientSecure* client,
                        const String& url, const char* rootCaPem) {
  client->setCACert(rootCaPem);
  return http->begin(*client, url);
}

String hostnameOnly(const String& url) {
  int start = url.indexOf("://");
  start = start < 0 ? 0 : start + 3;
  int end = url.indexOf('/', start);
  if (end < 0) end = url.length();
  String authority = url.substring(start, end);
  const int port = authority.indexOf(':');
  if (port >= 0) authority.remove(port);
  return authority;
}

bool successful(int statusCode) {
  return statusCode >= 200 && statusCode < 300;
}

void logHttpFailure(const char* step, int statusCode, const String& body) {
  Serial.printf("[upload] %s failed; HTTP=%d body=%s\n", step, statusCode,
                body.substring(0, 160).c_str());
  Serial0.printf("[upload] %s failed; HTTP=%d body=%s\n", step, statusCode,
                 body.substring(0, 160).c_str());
}

}  // namespace

struct UploadManager::UploadJob {
  uint8_t* jpeg = nullptr;
  size_t length = 0;
  uint16_t width = 0;
  uint16_t height = 0;
  uint32_t capturedMillis = 0;
  uint32_t generation = 0;
  char clientRequestId[37] = {};
};

bool UploadManager::begin(NetworkManager* network) {
  network_ = network;
  mutex_ = xSemaphoreCreateMutex();
  if (mutex_ == nullptr || network_ == nullptr) return false;
  return xTaskCreatePinnedToCore(taskEntry, "photo-upload", 12288, this, 1,
                                 &task_, 0) == pdPASS;
}

bool UploadManager::queuePhoto(const uint8_t* jpeg, size_t length,
                               uint16_t width, uint16_t height,
                               uint32_t capturedMillis,
                               uint32_t* generation) {
  if (jpeg == nullptr || length == 0 || mutex_ == nullptr) return false;
  if (task_ == nullptr) return false;

  auto* job = new UploadJob();
  if (job == nullptr) return false;
  job->jpeg = static_cast<uint8_t*>(
      heap_caps_malloc(length, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (job->jpeg == nullptr) {
    delete job;
    setStatus(UploadPhase::memoryError, 0);
    return false;
  }
  memcpy(job->jpeg, jpeg, length);
  job->length = length;
  job->width = width;
  job->height = height;
  job->capturedMillis = capturedMillis;
  makeUuid(job->clientRequestId);

  if (xSemaphoreTake(mutex_, portMAX_DELAY) != pdTRUE) {
    releaseJob(job);
    return false;
  }
  job->generation = ++nextGeneration_;
  const uint32_t queuedGeneration = job->generation;
  char queuedRequestId[37];
  strlcpy(queuedRequestId, job->clientRequestId, sizeof(queuedRequestId));
  UploadJob* replaced = pending_;
  pending_ = job;
  claimPending_ = false;
  status_.phase = network_->connected() ? UploadPhase::initiating
                                        : UploadPhase::waitingForWifi;
  status_.generation = queuedGeneration;
  status_.retryInMs = 0;
  if (generation != nullptr) *generation = queuedGeneration;
  xSemaphoreGive(mutex_);
  releaseJob(replaced);

  Serial.printf("[upload] queued generation=%lu request=%s bytes=%u\n",
                queuedGeneration, queuedRequestId,
                static_cast<unsigned>(length));
  Serial0.printf("[upload] queued generation=%lu request=%s bytes=%u\n",
                 queuedGeneration, queuedRequestId,
                 static_cast<unsigned>(length));
  return true;
}

UploadStatus UploadManager::status() const {
  UploadStatus result;
  if (mutex_ != nullptr && xSemaphoreTake(mutex_, pdMS_TO_TICKS(20)) == pdTRUE) {
    result = status_;
    xSemaphoreGive(mutex_);
  }
  return result;
}

bool UploadManager::takeClaimCode(uint32_t* generation, char* claimCode,
                                  size_t claimCodeLength, char* expiresAt,
                                  size_t expiresAtLength) {
  if (mutex_ == nullptr || claimCode == nullptr || claimCodeLength < 7 ||
      expiresAt == nullptr || expiresAtLength < sizeof(claimExpiresAt_)) {
    return false;
  }
  if (xSemaphoreTake(mutex_, pdMS_TO_TICKS(20)) != pdTRUE) return false;
  const bool available = claimPending_;
  if (available) {
    if (generation != nullptr) *generation = claimGeneration_;
    strlcpy(claimCode, claimCode_, claimCodeLength);
    strlcpy(expiresAt, claimExpiresAt_, expiresAtLength);
    claimPending_ = false;
  }
  xSemaphoreGive(mutex_);
  return available;
}

void UploadManager::taskEntry(void* argument) {
  static_cast<UploadManager*>(argument)->taskLoop();
}

void UploadManager::taskLoop() {
  for (;;) {
    UploadJob* job = takePending();
    if (job == nullptr) {
      vTaskDelay(pdMS_TO_TICKS(100));
      continue;
    }

    if (!DeviceConfig::uploadConfigured()) {
      setStatus(UploadPhase::configurationError, job->generation);
      Serial.println("[upload] secrets or TLS root CA not configured");
      Serial0.println("[upload] secrets or TLS root CA not configured");
      releaseJob(job);
      continue;
    }

    String draftId;
    unsigned long retryDelay = AppConfig::uploadRetryInitialMs;
    bool finished = false;
    while (!finished) {
      if (newerPhotoWaiting(job->generation)) break;
      if (!network_->connected()) {
        setStatus(UploadPhase::waitingForWifi, job->generation);
        vTaskDelay(pdMS_TO_TICKS(250));
        continue;
      }
      if (!network_->clockReady()) {
        setStatus(UploadPhase::waitingForTime, job->generation);
        vTaskDelay(pdMS_TO_TICKS(250));
        continue;
      }

      char capturedAt[25] = {};
      if (!network_->formatCapturedAt(job->capturedMillis, capturedAt,
                                      sizeof(capturedAt))) {
        setStatus(UploadPhase::waitingForTime, job->generation);
        vTaskDelay(pdMS_TO_TICKS(250));
        continue;
      }

      setStatus(UploadPhase::initiating, job->generation);
      char payload[320];
      snprintf(payload, sizeof(payload),
               "{\"clientRequestId\":\"%s\",\"capturedAt\":\"%s\","
               "\"mimeType\":\"image/jpeg\",\"width\":%u,\"height\":%u,"
               "\"originalSize\":%u}",
               job->clientRequestId, capturedAt, job->width, job->height,
               static_cast<unsigned>(job->length));

      WiFiClientSecure apiClient;
      HTTPClient initiate;
      configureHttp(&initiate);
      const String initiateUrl = endpoint("/device/drafts/initiate");
      bool initiated = false;
      int initiateStatusCode = -1;
      String uploadUrl;
      if (beginSecureRequest(&initiate, &apiClient, initiateUrl,
                             tlsRootCaPem)) {
        initiate.addHeader("Authorization", String("Bearer ") + deviceCredential);
        initiate.addHeader("Content-Type", "application/json");
        initiateStatusCode = initiate.POST(
            reinterpret_cast<uint8_t*>(payload), strlen(payload));
        const String response = initiate.getString();
        initiated = successful(initiateStatusCode) &&
                    extractJsonString(response, "draftId", &draftId) &&
                    extractJsonString(response, "url", &uploadUrl);
        if (!initiated) logHttpFailure("initiate", initiateStatusCode, response);
        initiate.end();
      }

      if (!initiated) {
        if (initiateStatusCode == 401 || initiateStatusCode == 403) {
          setStatus(UploadPhase::authenticationError, job->generation);
          break;
        }
        if (initiateStatusCode >= 400 && initiateStatusCode < 500 &&
            initiateStatusCode != 408 && initiateStatusCode != 429) {
          setStatus(UploadPhase::serverRejected, job->generation);
          break;
        }
        setStatus(UploadPhase::retrying, job->generation, retryDelay);
        if (!waitBeforeRetry(retryDelay, job->generation)) break;
        retryDelay = min(retryDelay * 2UL, AppConfig::uploadRetryMaximumMs);
        continue;
      }

      const String r2Host = hostnameOnly(uploadUrl);
      Serial.printf("[upload] R2 host=%s TLS root=GTS Root R4\n",
                    r2Host.c_str());
      Serial0.printf("[upload] R2 host=%s TLS root=GTS Root R4\n",
                     r2Host.c_str());

      setStatus(UploadPhase::uploading, job->generation);
      WiFiClientSecure r2Client;
      HTTPClient put;
      configureHttp(&put);
      bool uploaded = false;
      if (beginSecureRequest(&put, &r2Client, uploadUrl, r2TlsRootCaPem)) {
        put.addHeader("Content-Type", "image/jpeg");
        const int statusCode = put.sendRequest("PUT", job->jpeg, job->length);
        const String response = put.getString();
        uploaded = successful(statusCode);
        if (!uploaded) logHttpFailure("R2 PUT", statusCode, response);
        put.end();
      }
      if (!uploaded) {
        setStatus(UploadPhase::retrying, job->generation, retryDelay);
        if (!waitBeforeRetry(retryDelay, job->generation)) break;
        retryDelay = min(retryDelay * 2UL, AppConfig::uploadRetryMaximumMs);
        continue;
      }

      setStatus(UploadPhase::completing, job->generation);
      WiFiClientSecure completeClient;
      HTTPClient complete;
      configureHttp(&complete);
      const String completePath =
          String("/device/drafts/") + draftId + "/complete";
      const String completeUrl = endpoint(completePath.c_str());
      bool completed = false;
      int completeStatusCode = -1;
      String claimCode;
      String claimExpiresAt;
      if (beginSecureRequest(&complete, &completeClient, completeUrl,
                             tlsRootCaPem)) {
        complete.addHeader("Authorization", String("Bearer ") + deviceCredential);
        complete.addHeader("Content-Type", "application/json");
        completeStatusCode = complete.POST("{}");
        const String response = complete.getString();
        completed = successful(completeStatusCode) &&
                    extractJsonString(response, "claimCode", &claimCode) &&
                    extractJsonString(response, "claimExpiresAt", &claimExpiresAt);
        if (!completed) logHttpFailure("complete", completeStatusCode, response);
        complete.end();
      }
      if (!completed) {
        if (completeStatusCode == 401 || completeStatusCode == 403) {
          setStatus(UploadPhase::authenticationError, job->generation);
          break;
        }
        if (completeStatusCode >= 400 && completeStatusCode < 500 &&
            completeStatusCode != 408 && completeStatusCode != 409 &&
            completeStatusCode != 429) {
          setStatus(UploadPhase::serverRejected, job->generation);
          break;
        }
        setStatus(UploadPhase::retrying, job->generation, retryDelay);
        if (!waitBeforeRetry(retryDelay, job->generation)) break;
        retryDelay = min(retryDelay * 2UL, AppConfig::uploadRetryMaximumMs);
        continue;
      }

      publishClaim(job->generation, claimCode, claimExpiresAt);
      Serial.printf("[upload] complete generation=%lu code=%s expires=%s\n",
                    job->generation, claimCode.c_str(), claimExpiresAt.c_str());
      Serial0.printf("[upload] complete generation=%lu code=%s expires=%s\n",
                     job->generation, claimCode.c_str(), claimExpiresAt.c_str());
      finished = true;
    }
    releaseJob(job);
  }
}

UploadManager::UploadJob* UploadManager::takePending() {
  if (mutex_ == nullptr ||
      xSemaphoreTake(mutex_, pdMS_TO_TICKS(20)) != pdTRUE) return nullptr;
  UploadJob* result = pending_;
  pending_ = nullptr;
  xSemaphoreGive(mutex_);
  return result;
}

bool UploadManager::newerPhotoWaiting(uint32_t generation) const {
  if (mutex_ == nullptr ||
      xSemaphoreTake(mutex_, pdMS_TO_TICKS(20)) != pdTRUE) return false;
  const bool newer = pending_ != nullptr && pending_->generation > generation;
  xSemaphoreGive(mutex_);
  return newer;
}

bool UploadManager::waitBeforeRetry(unsigned long delayMs,
                                    uint32_t generation) {
  const unsigned long started = millis();
  while (millis() - started < delayMs) {
    if (newerPhotoWaiting(generation)) return false;
    vTaskDelay(pdMS_TO_TICKS(100));
  }
  return true;
}

void UploadManager::setStatus(UploadPhase phase, uint32_t generation,
                              unsigned long retryInMs) {
  if (mutex_ == nullptr ||
      xSemaphoreTake(mutex_, pdMS_TO_TICKS(20)) != pdTRUE) return;
  status_.phase = phase;
  status_.generation = generation;
  status_.retryInMs = retryInMs;
  xSemaphoreGive(mutex_);
}

void UploadManager::publishClaim(uint32_t generation, const String& code,
                                 const String& expiresAt) {
  if (mutex_ == nullptr ||
      xSemaphoreTake(mutex_, portMAX_DELAY) != pdTRUE) return;
  status_.phase = UploadPhase::ready;
  status_.generation = generation;
  status_.retryInMs = 0;
  claimPending_ = true;
  claimGeneration_ = generation;
  strlcpy(claimCode_, code.c_str(), sizeof(claimCode_));
  strlcpy(claimExpiresAt_, expiresAt.c_str(), sizeof(claimExpiresAt_));
  xSemaphoreGive(mutex_);
}

void UploadManager::releaseJob(UploadJob* job) {
  if (job == nullptr) return;
  if (job->jpeg != nullptr) heap_caps_free(job->jpeg);
  delete job;
}
