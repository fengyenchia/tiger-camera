#include <Arduino.h>
#include "esp_heap_caps.h"

#include "app_config.h"
#include "board_pins.h"
#include "camera_controller.h"
#include "display_controller.h"
#include "latest_photo_buffer.h"
#include "shutter_button.h"

enum class CameraState {
  booting,
  liveView,
  capturing,
  copying,
  review,
  error,
};

CameraController camera;
DisplayController display;
LatestPhotoBuffer latestPhoto;
ShutterButton shutter(BoardPins::shutter, AppConfig::shutterDebounceMs);

CameraState state = CameraState::booting;
unsigned long stateStartedMs = 0;
unsigned long lastPreviewMs = 0;

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
    enterState(CameraState::error);
    return;
  }

  const bool rendered = display.drawJpeg(latestPhoto.dataUnsafe(),
                                         latestPhoto.sizeUnsafe());
  latestPhoto.unlock();
  if (!rendered) {
    display.showStatus("JPEG ERROR");
    enterState(CameraState::error);
    return;
  }
  enterState(CameraState::review);
}

void capturePhoto() {
  enterState(CameraState::capturing);
  display.showStatus("CAPTURING");

  if (AppConfig::captureFrameSize != AppConfig::previewFrameSize &&
      !camera.setFrameSize(AppConfig::captureFrameSize)) {
    display.showStatus("CAMERA ERROR", "resolution");
    enterState(CameraState::error);
    return;
  }

  // Preview already runs at VGA, so white balance remains settled. Discard one
  // queued frame to capture a frame produced after the shutter press.
  camera.flushFrames(1);
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
    }
    display.showStatus("CAPTURE ERROR", reason);
    enterState(CameraState::error);
    return;
  }

  enterState(CameraState::copying);
  const size_t capturedSize = frame->len;
  const bool copied = latestPhoto.replace(frame->buf, frame->len);

  // The camera framebuffer is returned only after the JPEG is fully copied.
  camera.releaseFrame(frame);
  if (AppConfig::captureFrameSize != AppConfig::previewFrameSize) {
    camera.setFrameSize(AppConfig::previewFrameSize);
    camera.flushFrames(2);
  }

  if (!copied) {
    display.showStatus("PSRAM ERROR", "old photo kept");
    enterState(CameraState::error);
    return;
  }

  Serial.printf("[photo] captured %u bytes; free PSRAM %u bytes\n",
                static_cast<unsigned>(capturedSize),
                static_cast<unsigned>(
                    heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));
  Serial0.printf("[photo] captured %u bytes; free PSRAM %u bytes\n",
                 static_cast<unsigned>(capturedSize),
                 static_cast<unsigned>(
                     heap_caps_get_free_size(MALLOC_CAP_SPIRAM)));
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
    
  // Serial is native USB CDC on the OTG connector; Serial0 is UART0 on the
  // board's CH340/TTL connector. Mirror diagnostics to both during Gate H1.
  Serial0.begin(115200);
  delay(800);

  display.begin();
  display.showColorTest();
  delay(1000);
  display.showStatus("TIGER CAMERA", "Gate H1");
  printMemoryReport();

  if (!psramFound() || ESP.getPsramSize() == 0) {
    display.showStatus("PSRAM ERROR", "not detected");
    enterState(CameraState::error);
    return;
  }
  if (!latestPhoto.begin()) {
    display.showStatus("MUTEX ERROR");
    enterState(CameraState::error);
    return;
  }
  if (!camera.begin()) {
    display.showStatus("CAMERA ERROR", "init failed");
    enterState(CameraState::error);
    return;
  }

  shutter.begin();
  display.showStatus("READY", "press shutter");
  delay(500);
  shutter.discardPending();
  enterState(CameraState::liveView);
}

void loop() {
  const unsigned long now = millis();

  if (state == CameraState::liveView) {
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
    enterState(CameraState::liveView);
    return;
  }

  if (state == CameraState::error &&
      now - stateStartedMs >= AppConfig::errorDurationMs) {
    if (esp_camera_sensor_get() != nullptr) {
      camera.setFrameSize(AppConfig::previewFrameSize);
      camera.flushFrames(2);
      shutter.discardPending();
      enterState(CameraState::liveView);
    }
  }

  delay(5);
}
