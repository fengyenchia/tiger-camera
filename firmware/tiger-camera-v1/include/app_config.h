#pragma once

#include "esp_camera.h"

namespace AppConfig {

// Keep preview and capture at VGA so pressing the shutter does not reset the
// sensor mode and disturb its already-settled auto white balance.
constexpr framesize_t previewFrameSize = FRAMESIZE_VGA;
constexpr framesize_t captureFrameSize = FRAMESIZE_VGA;
constexpr int jpegQuality = 8;
constexpr unsigned long previewIntervalMs = 180;
constexpr unsigned long reviewDurationMs = 3500;
constexpr unsigned long errorDurationMs = 1500;
constexpr unsigned long shutterDebounceMs = 35;

// Gate L0 networking stays independent from the camera state machine. A
// failed hotspot or upload must never reboot or disable local capture.
constexpr unsigned long wifiConnectTimeoutMs = 12000;
constexpr unsigned long wifiRetryInitialMs = 2000;
constexpr unsigned long wifiRetryMaximumMs = 60000;
constexpr unsigned long uploadRetryInitialMs = 2000;
constexpr unsigned long uploadRetryMaximumMs = 60000;
constexpr unsigned long uploadNoticeDurationMs = 1200;
constexpr unsigned long httpConnectTimeoutMs = 10000;
constexpr unsigned long httpRequestTimeoutMs = 20000;
constexpr unsigned long validUnixTime = 1704067200UL;  // 2024-01-01 UTC
constexpr char ntpServerPrimary[] = "pool.ntp.org";
constexpr char ntpServerSecondary[] = "time.google.com";

// Conservative OV2640 indoor defaults. Each value remains within the sensor
// driver's documented range and can be tuned after comparing the original JPEG
// (not only the TFT preview) under the intended lighting.
constexpr int sensorBrightness = 0;   // -2 to 2
constexpr int sensorContrast = 1;     // -2 to 2
constexpr int sensorSaturation = 2;   // -2 to 2
constexpr int sensorAutoExposureLevel = 0;  // -2 to 2
constexpr int sensorAdvancedExposure = 0;
constexpr gainceiling_t sensorGainCeiling = GAINCEILING_8X;

// Compensate the visible active-area offset of the tested ST7735 module.
constexpr int displayTextOffsetX = 3;
constexpr int displayTextOffsetY = -3;
constexpr bool displayInverted = false;

}  // namespace AppConfig
