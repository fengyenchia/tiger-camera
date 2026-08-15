#pragma once

#include "esp_camera.h"

namespace AppConfig {

constexpr framesize_t previewFrameSize = FRAMESIZE_240X240;
constexpr framesize_t captureFrameSize = FRAMESIZE_XGA;
constexpr int jpegQuality = 12;
constexpr unsigned long previewIntervalMs = 180;
constexpr unsigned long reviewDurationMs = 3500;
constexpr unsigned long errorDurationMs = 1500;
constexpr unsigned long shutterDebounceMs = 35;

}  // namespace AppConfig
