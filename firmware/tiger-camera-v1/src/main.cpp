#include <Arduino.h>
#include "esp_heap_caps.h"

#include "app_config.h"
#include "battery_monitor.h"
#include "board_pins.h"
#include "camera_controller.h"
#include "display_controller.h"
#include "latest_photo_buffer.h"
#include "network_manager.h"
#include "shutter_button.h"
#include "upload_manager.h"

enum class CameraState {
  booting,
  liveView,
  capturing,
  copying,
  review,
  uploadNotice,
  claimReady,
  error,
};

CameraController camera;
DisplayController display;
LatestPhotoBuffer latestPhoto;
NetworkManager network;
UploadManager uploader;
ShutterButton shutter(BoardPins::shutter, AppConfig::shutterDebounceMs);
BatteryMonitor battery(BoardPins::batterySense);

CameraState state = CameraState::booting;
unsigned long stateStartedMs = 0;
unsigned long lastPreviewMs = 0;
uint32_t latestUploadGeneration = 0;
bool latestClaimAvailable = false;
char latestClaimCode[7] = {};
char latestClaimExpiresAt[25] = {};

void enterState(CameraState next) {
  state = next;
  stateStartedMs = millis();
}

void printMemoryReport() {
  Serial.printf("[board] flash: %u bytes\n",
                static_cast<unsigned>(ESP.getFlashChipSize()));
  Serial.printf("[board] psram detected: %s\n", psramFound() ? "yes" : "no");
  Serial.printf("[board] psram total: %u bytes\n",
                static_cast<unsigned>(ESP.getPsramSize()));
  Serial.printf("[board] psram free: %u bytes\n",
                static_cast<unsigned>(heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));
  Serial0.printf("[board] flash: %u bytes\n",
                 static_cast<unsigned>(ESP.getFlashChipSize()));
  Serial0.printf("[board] psram detected: %s\n", psramFound() ? "yes" : "no");
  Serial0.printf("[board] psram total: %u bytes\n",
                 static_cast<unsigned>(ESP.getPsramSize()));
  Serial0.printf(
      "[board] psram free: %u bytes\n",
      static_cast<unsigned>(heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));
}

void showLatestPhoto() {
  if (!latestPhoto.lock(pdMS_TO_TICKS(1000))) {
    display.showStatus("BUFFER BUSY");
    delay(1000);
    enterState(CameraState::error);
    return;
  }

  const bool rendered = display.drawJpeg(latestPhoto.dataUnsafe(),
                                         latestPhoto.sizeUnsafe());
  latestPhoto.unlock();
  if (!rendered) {
    display.showStatus("JPEG ERROR");
    delay(1000);
    enterState(CameraState::error);
    return;
  }
  const BatteryReading& batteryReading = battery.reading();
  display.showBatteryOverlay(batteryReading.volts, batteryReading.percent,
                             batteryReading.valid);
  enterState(CameraState::review);
}

void pollUploadResult() {
  uint32_t generation = 0;
  char claimCode[7] = {};
  char expiresAt[25] = {};
  if (!uploader.takeClaimCode(&generation, claimCode, sizeof(claimCode),
                              expiresAt, sizeof(expiresAt))) {
    return;
  }
  if (generation != latestUploadGeneration) {
    Serial.printf("[upload] ignored stale claim generation=%lu latest=%lu\n",
                  generation, latestUploadGeneration);
    Serial0.printf("[upload] ignored stale claim generation=%lu latest=%lu\n",
                   generation, latestUploadGeneration);
    return;
  }
  strlcpy(latestClaimCode, claimCode, sizeof(latestClaimCode));
  strlcpy(latestClaimExpiresAt, expiresAt, sizeof(latestClaimExpiresAt));
  latestClaimAvailable = true;
}

void showUploadNotice() {
  const UploadStatus uploadStatus = uploader.status();
  switch (uploadStatus.phase) {
    case UploadPhase::waitingForWifi:
      display.showStatus("WAITING WIFI", "photo kept");
      delay(1000);
      break;
    case UploadPhase::waitingForTime:
      display.showStatus("SYNCING TIME", "photo kept");
      delay(1000);
      break;
    case UploadPhase::configurationError:
      display.showStatus("UPLOAD OFF", "check secrets");
      delay(1000);
      break;
    case UploadPhase::authenticationError:
      display.showStatus("DEVICE ERROR", "credential");
      delay(1000);
      break;
    case UploadPhase::serverRejected:
      display.showStatus("UPLOAD ERROR", "check serial");
      delay(1000);
      break;
    case UploadPhase::memoryError:
      display.showStatus("UPLOAD ERROR", "photo kept");
      delay(1000);
      break;
    case UploadPhase::retrying:
      display.showStatus("UPLOAD RETRY", "photo kept");
      delay(1000);
      break;
    default:
      display.showStatus("UPLOADING", "private draft");
      delay(1000);
      break;
  }
  enterState(CameraState::uploadNotice);
}

void showLatestClaim() {
  display.showClaimCode(latestClaimCode);
  Serial.printf("[claim] code=%s expires=%s\n", latestClaimCode,
                latestClaimExpiresAt);
  Serial0.printf("[claim] code=%s expires=%s\n", latestClaimCode,
                 latestClaimExpiresAt);
  enterState(CameraState::claimReady);
}

void capturePhoto() {
  latestClaimAvailable = false;
  enterState(CameraState::capturing);
  display.showStatus("CAPTURING");
  delay(1000);

  if (AppConfig::captureFrameSize != AppConfig::previewFrameSize) {
    if (!camera.setFrameSize(AppConfig::captureFrameSize)) {
      display.showStatus("CAMERA ERROR", "resolution");
      delay(1000);
      enterState(CameraState::error);
      return;
    }

    // Only discard transition frames when the sensor mode actually changes.
    camera.flushFrames(AppConfig::captureSettleFrames);
  }
  camera_fb_t* frame = camera.acquireFrame();
  if (frame == nullptr || frame->format != PIXFORMAT_JPEG || frame->len == 0) {
    const char* reason = frame == nullptr
                             ? "no framebuffer"
                             : (frame->format != PIXFORMAT_JPEG ? "not JPEG"
                                                                : "empty JPEG");
    Serial.printf("[photo] capture failed: %s\n", reason);
    Serial0.printf("[photo] capture failed: %s\n", reason);
    camera.releaseFrame(frame);
    if (AppConfig::captureFrameSize != AppConfig::previewFrameSize) {
      camera.setFrameSize(AppConfig::previewFrameSize);
      camera.flushFrames(AppConfig::previewSettleFrames);
    }
    display.showStatus("CAPTURE ERROR", reason);
    delay(1000);
    enterState(CameraState::error);
    return;
  }

  enterState(CameraState::copying);
  const size_t capturedSize = frame->len;
  const uint16_t capturedWidth = frame->width;
  const uint16_t capturedHeight = frame->height;
  const uint32_t capturedMillis = millis();
  const bool copied = latestPhoto.replace(frame->buf, frame->len);

  // The camera framebuffer is returned only after the JPEG is fully copied.
  camera.releaseFrame(frame);
  if (AppConfig::captureFrameSize != AppConfig::previewFrameSize) {
    camera.setFrameSize(AppConfig::previewFrameSize);
    camera.flushFrames(AppConfig::previewSettleFrames);
  }

  if (!copied) {
    display.showStatus("PSRAM ERROR", "old photo kept");
    delay(1000);
    enterState(CameraState::error);
    return;
  }

  Serial.printf("[photo] captured %ux%u %u bytes; free PSRAM %u bytes\n",
                static_cast<unsigned>(capturedWidth),
                static_cast<unsigned>(capturedHeight),
                static_cast<unsigned>(capturedSize),
                static_cast<unsigned>(
                    heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));
  Serial0.printf("[photo] captured %ux%u %u bytes; free PSRAM %u bytes\n",
                 static_cast<unsigned>(capturedWidth),
                 static_cast<unsigned>(capturedHeight),
                 static_cast<unsigned>(capturedSize),
                 static_cast<unsigned>(
                     heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));

  // A successful local capture invalidates every older claim immediately,
  // even if allocating the new upload snapshot fails.
  latestUploadGeneration = UINT32_MAX;
  bool queued = false;
  if (latestPhoto.lock(pdMS_TO_TICKS(1000))) {
    queued = uploader.queuePhoto(
        latestPhoto.dataUnsafe(), latestPhoto.sizeUnsafe(), capturedWidth,
        capturedHeight, capturedMillis, &latestUploadGeneration);
    latestPhoto.unlock();
  }
  if (!queued) {
    Serial.println("[upload] could not queue photo; local JPEG remains available");
    Serial0.println("[upload] could not queue photo; local JPEG remains available");
  }
  showLatestPhoto();
}

void drawLivePreview() {
  camera_fb_t* frame = camera.acquireFrame();
  if (frame == nullptr) {
    Serial.println("[preview] frame unavailable");
    return;
  }
  if (frame->format == PIXFORMAT_JPEG) {
    display.drawJpeg(frame->buf, frame->len);
    const BatteryReading& batteryReading = battery.reading();
    display.showBatteryOverlay(batteryReading.volts, batteryReading.percent,
                               batteryReading.valid);
  }
  camera.releaseFrame(frame);
}

void setup() {
  Serial.begin(115200);

  // 等待 USB 串口連線成功（最多等 3 秒避免卡死）
  unsigned long start = millis();
  while (!Serial && (millis() - start < 3000)) {
    delay(10);
  }

  Serial.println("ESP32-S3 Camera Booting...");

  Serial0.begin(115200);
  delay(800);

  display.begin();
  battery.begin();

  // ─── 頁面 1: 四色色塊測試（停留 1 秒）───
  display.showColorTest();
  delay(1000);

  // ─── 頁面 2: 品牌主視覺（停留 2.0 秒）───
  display.showSplashPage("TIGER CAM", "by Yen-Chia Feng");
  delay(2000);

  // ─── 頁面 3: 終端機 Log 與逐項初始化 ───
  display.showBootLogPage();
  delay(400);

  // 1. PSRAM 檢測
  if (!psramFound() || ESP.getPsramSize() == 0) {
    display.appendBootLog("PSRAM", "FAIL", 25);
    delay(1500);
    display.showStatus("PSRAM ERROR", "not detected");
    enterState(CameraState::error);
    return;
  }
  display.appendBootLog("PSRAM", "OK", 25);
  printMemoryReport();
  delay(600);

  // 2. 緩衝區初始化
  if (!latestPhoto.begin()) {
    display.appendBootLog("BUFFER", "FAIL", 50);
    delay(1500);
    display.showStatus("MUTEX ERROR");
    enterState(CameraState::error);
    return;
  }
  display.appendBootLog("BUFFER", "OK", 50);
  delay(600);

  // 3. 網路與上傳管理器
  network.begin();
  if (!uploader.begin(&network)) {
    Serial.println("[upload] background task unavailable; camera remains local-only");
    Serial0.println("[upload] background task unavailable; camera remains local-only");
  }
  display.appendBootLog("NETWORK", "OK", 75);
  delay(600);

  // 4. OV2640 相機模組
  if (!camera.begin()) {
    display.appendBootLog("CAMERA", "FAIL", 100);
    delay(1500);
    display.showStatus("CAMERA ERROR", "init failed");
    enterState(CameraState::error);
    return;
  }
  display.appendBootLog("CAMERA", "OK", 100);
  delay(1000);

  // ─── 完成並提示拍照 ───
  shutter.begin();
  display.showStatus("READY", "press shutter");
  delay(1800);
  shutter.discardPending();
  enterState(CameraState::liveView);
}

void loop() {
  const unsigned long now = millis();
  battery.loop();
  network.loop();
  pollUploadResult();

  if (state == CameraState::liveView) {
    if (latestClaimAvailable) {
      showLatestClaim();
      return;
    }
    if (shutter.pressed()) {
      capturePhoto();
      return;
    }
    if (now - lastPreviewMs >= AppConfig::previewIntervalMs) {
      lastPreviewMs = now;
      drawLivePreview();
    }
    return;
  }

  if (state == CameraState::review &&
      now - stateStartedMs >= AppConfig::reviewDurationMs) {
    // Capturing and review intentionally ignore presses and switch bounce.
    shutter.discardPending();
    if (latestClaimAvailable) {
      showLatestClaim();
    } else {
      showUploadNotice();
    }
    return;
  }

  if (state == CameraState::uploadNotice &&
      now - stateStartedMs >= AppConfig::uploadNoticeDurationMs) {
    shutter.discardPending();
    if (latestClaimAvailable) {
      showLatestClaim();
    } else {
      enterState(CameraState::liveView);
    }
    return;
  }

  if (state == CameraState::claimReady) {
    // The first press dismisses the code and returns to live view. A later
    // press from live view captures the next photo, preventing an accidental
    // shot while the owner is only trying to leave the claim screen.
    if (shutter.pressed()) {
      latestClaimAvailable = false;
      enterState(CameraState::liveView);
    }
    return;
  }

  if (state == CameraState::error &&
      now - stateStartedMs >= AppConfig::errorDurationMs) {
    if (esp_camera_sensor_get() != nullptr) {
      camera.setFrameSize(AppConfig::previewFrameSize);
      camera.flushFrames(AppConfig::previewSettleFrames);
      shutter.discardPending();
      enterState(CameraState::liveView);
    }
  }

  delay(5);
}
