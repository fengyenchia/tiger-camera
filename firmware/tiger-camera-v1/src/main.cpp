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

  if (!camera.setFrameSize(AppConfig::captureFrameSize)) {
    display.showStatus("CAMERA ERROR", "resolution");
    enterState(CameraState::error);
    return;
  }

  delay(120);
  camera.flushFrames(2);
  camera_fb_t* frame = camera.acquireFrame();
  if (frame == nullptr || frame->format != PIXFORMAT_JPEG || frame->len == 0) {
    camera.releaseFrame(frame);
    camera.setFrameSize(AppConfig::previewFrameSize);
    display.showStatus("CAPTURE ERROR");
    enterState(CameraState::error);
    return;
  }

  enterState(CameraState::copying);
  const size_t capturedSize = frame->len;
  const bool copied = latestPhoto.replace(frame->buf, frame->len);

  // The camera framebuffer is returned only after the JPEG is fully copied.
  camera.releaseFrame(frame);
  camera.setFrameSize(AppConfig::previewFrameSize);
  camera.flushFrames(2);

  if (!copied) {
    display.showStatus("PSRAM ERROR", "old photo kept");
    enterState(CameraState::error);
    return;
  }

  Serial.printf("[photo] captured %u bytes; free PSRAM %u bytes\n",
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
  delay(800);

  display.begin();
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
    enterState(CameraState::liveView);
    return;
  }

  if (state == CameraState::error &&
      now - stateStartedMs >= AppConfig::errorDurationMs) {
    if (esp_camera_sensor_get() != nullptr) {
      camera.setFrameSize(AppConfig::previewFrameSize);
      camera.flushFrames(2);
      enterState(CameraState::liveView);
    }
  }

  delay(5);
}

