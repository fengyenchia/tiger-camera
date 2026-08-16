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
  // Framebuffer allocation happens during esp_camera_init(). Allocate for the
  // largest V1 capture size, then lower only the sensor output for live view.
  // Initializing at preview size can leave buffers too small for a later XGA
  // frame and causes esp_camera_fb_get() to return null.
  config.frame_size = AppConfig::captureFrameSize;
  config.jpeg_quality = AppConfig::jpegQuality;
  config.fb_count = 2;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  const esp_err_t result = esp_camera_init(&config);
  if (result != ESP_OK) {
    Serial.printf("[camera] init failed: 0x%x\n", result);
    Serial0.printf("[camera] init failed: 0x%x\n", result);
    return false;
  }

  sensor_t* sensor = esp_camera_sensor_get();
  if (sensor == nullptr) {
    Serial.println("[camera] sensor unavailable");
    esp_camera_deinit();
    return false;
  }

  bool tuningApplied = true;
  tuningApplied &= sensor->set_framesize(sensor, AppConfig::previewFrameSize) == 0;
  tuningApplied &= sensor->set_whitebal(sensor, 1) == 0;
  tuningApplied &= sensor->set_awb_gain(sensor, 1) == 0;
  tuningApplied &= sensor->set_wb_mode(sensor, 0) == 0;
  tuningApplied &= sensor->set_exposure_ctrl(sensor, 1) == 0;
  tuningApplied &=
      sensor->set_aec2(sensor, AppConfig::sensorAdvancedExposure) == 0;
  tuningApplied &= sensor->set_gain_ctrl(sensor, 1) == 0;
  tuningApplied &=
      sensor->set_gainceiling(sensor, AppConfig::sensorGainCeiling) == 0;
  tuningApplied &=
      sensor->set_brightness(sensor, AppConfig::sensorBrightness) == 0;
  tuningApplied &= sensor->set_contrast(sensor, AppConfig::sensorContrast) == 0;
  tuningApplied &=
      sensor->set_saturation(sensor, AppConfig::sensorSaturation) == 0;
  tuningApplied &=
      sensor->set_ae_level(sensor, AppConfig::sensorAutoExposureLevel) == 0;
  tuningApplied &= sensor->set_bpc(sensor, 1) == 0;
  tuningApplied &= sensor->set_wpc(sensor, 1) == 0;
  tuningApplied &= sensor->set_raw_gma(sensor, 1) == 0;
  tuningApplied &= sensor->set_lenc(sensor, 1) == 0;

  Serial.printf("[camera] ready, PID=0x%02x, tuning=%s\n", sensor->id.PID,
                tuningApplied ? "applied" : "partial");
  Serial0.printf("[camera] ready, PID=0x%02x, tuning=%s\n", sensor->id.PID,
                 tuningApplied ? "applied" : "partial");
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
