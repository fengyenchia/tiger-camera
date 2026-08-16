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
