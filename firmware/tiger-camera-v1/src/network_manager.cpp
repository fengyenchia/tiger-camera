#include "network_manager.h"

#include <WiFi.h>
#include <time.h>

#include "app_config.h"
#include "device_config.h"

void NetworkManager::begin() {
  configured_ = DeviceConfig::wifiConfigured();
  retryDelayMs_ = AppConfig::wifiRetryInitialMs;
  if (!configured_) {
    Serial.println("[wifi] secrets.h missing or SSID is not configured; camera remains offline");
    Serial0.println("[wifi] secrets.h missing or SSID is not configured; camera remains offline");
    return;
  }

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(false);
  nextAttemptMs_ = millis();
}

void NetworkManager::loop() {
  if (!configured_) {
    return;
  }

  const unsigned long now = millis();
  const bool isConnected = WiFi.status() == WL_CONNECTED;
  if (isConnected) {
    connecting_ = false;
    retryDelayMs_ = AppConfig::wifiRetryInitialMs;
    if (!wasConnected_) {
      Serial.printf("[wifi] connected; IP=%s RSSI=%d dBm\n",
                    WiFi.localIP().toString().c_str(), WiFi.RSSI());
      Serial0.printf("[wifi] connected; IP=%s RSSI=%d dBm\n",
                     WiFi.localIP().toString().c_str(), WiFi.RSSI());
    }
    wasConnected_ = true;
    if (!clockStarted_) {
      configTime(0, 0, AppConfig::ntpServerPrimary,
                 AppConfig::ntpServerSecondary);
      clockStarted_ = true;
      Serial.println("[time] NTP synchronization started");
      Serial0.println("[time] NTP synchronization started");
    }
    return;
  }

  if (wasConnected_) {
    Serial.println("[wifi] disconnected; local camera remains available");
    Serial0.println("[wifi] disconnected; local camera remains available");
    wasConnected_ = false;
    connecting_ = false;
    nextAttemptMs_ = now;
  }

  if (connecting_) {
    if (now - attemptStartedMs_ < AppConfig::wifiConnectTimeoutMs) {
      return;
    }
    WiFi.disconnect(false, false);
    connecting_ = false;
    Serial.println("[wifi] connection timed out");
    Serial0.println("[wifi] connection timed out");
    scheduleRetry(now);
    return;
  }

  if (static_cast<long>(now - nextAttemptMs_) >= 0) {
    startConnection();
  }
}

bool NetworkManager::configured() const { return configured_; }

bool NetworkManager::connected() const {
  return configured_ && WiFi.status() == WL_CONNECTED;
}

bool NetworkManager::clockReady() const {
  return static_cast<unsigned long>(time(nullptr)) >= AppConfig::validUnixTime;
}

bool NetworkManager::formatCapturedAt(uint32_t capturedMillis, char* output,
                                      size_t outputLength) const {
  if (!clockReady() || output == nullptr || outputLength < 21) {
    return false;
  }

  const time_t now = time(nullptr);
  const uint32_t elapsedSeconds = (millis() - capturedMillis) / 1000UL;
  const time_t capturedAt = now - static_cast<time_t>(elapsedSeconds);
  struct tm utcTime {};
  gmtime_r(&capturedAt, &utcTime);
  return strftime(output, outputLength, "%Y-%m-%dT%H:%M:%SZ", &utcTime) > 0;
}

void NetworkManager::startConnection() {
  Serial.printf("[wifi] connecting to %s\n", wifiSsid);
  Serial0.printf("[wifi] connecting to %s\n", wifiSsid);
  WiFi.begin(wifiSsid, wifiPassword);
  connecting_ = true;
  attemptStartedMs_ = millis();
}

void NetworkManager::scheduleRetry(unsigned long now) {
  nextAttemptMs_ = now + retryDelayMs_;
  Serial.printf("[wifi] retry in %lu ms\n", retryDelayMs_);
  Serial0.printf("[wifi] retry in %lu ms\n", retryDelayMs_);
  retryDelayMs_ = min(retryDelayMs_ * 2UL, AppConfig::wifiRetryMaximumMs);
}
