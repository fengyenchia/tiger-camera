#include "camera_controller.h"

#include <Arduino.h>

#include "app_config.h"
#include "board_pins.h"

bool CameraController::begin() {
  camera_config_t config{};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = BoardPins::cameraY2;
  config.pin_d1 = BoardPins::cameraY3;
  config.pin_d2 = BoardPins::cameraY4;
  config.pin_d3 = BoardPins::cameraY5;
  config.pin_d4 = BoardPins::cameraY6;
  config.pin_d5 = BoardPins::cameraY7;
  config.pin_d6 = BoardPins::cameraY8;
  config.pin_d7 = BoardPins::cameraY9;
  config.pin_xclk = BoardPins::cameraXclk;
  config.pin_pclk = BoardPins::cameraPclk;
  config.pin_vsync = BoardPins::cameraVsync;
  config.pin_href = BoardPins::cameraHref;
  config.pin_sccb_sda = BoardPins::cameraSiod;
  config.pin_sccb_scl = BoardPins::cameraSioc;
  config.pin_pwdn = BoardPins::cameraPowerDown;
  config.pin_reset = BoardPins::cameraReset;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = AppConfig::previewFrameSize;
  config.jpeg_quality = AppConfig::jpegQuality;
  config.fb_count = 2;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  const esp_err_t result = esp_camera_init(&config);
  if (result != ESP_OK) {
    Serial.printf("[camera] init failed: 0x%x\n", result);
    return false;
  }

  sensor_t* sensor = esp_camera_sensor_get();
  if (sensor == nullptr) {
    Serial.println("[camera] sensor unavailable");
    esp_camera_deinit();
    return false;
  }

  sensor->set_framesize(sensor, AppConfig::previewFrameSize);
  Serial.printf("[camera] ready, PID=0x%02x\n", sensor->id.PID);
  return true;
}

camera_fb_t* CameraController::acquireFrame() {
  return esp_camera_fb_get();
}

void CameraController::releaseFrame(camera_fb_t* frame) {
  if (frame != nullptr) {
    esp_camera_fb_return(frame);
  }
}

bool CameraController::setFrameSize(framesize_t size) {
  sensor_t* sensor = esp_camera_sensor_get();
  return sensor != nullptr && sensor->set_framesize(sensor, size) == 0;
}

void CameraController::flushFrames(unsigned char count) {
  for (unsigned char index = 0; index < count; ++index) {
    camera_fb_t* frame = acquireFrame();
    releaseFrame(frame);
  }
}
