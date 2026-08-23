#pragma once

#include <Arduino.h>

#if __has_include("secrets.h")
#include "secrets.h"
#define TIGER_CAMERA_HAS_SECRETS 1
#else
#include "secrets.example.h"
#define TIGER_CAMERA_HAS_SECRETS 0
#endif

namespace DeviceConfig {

inline bool hasRealValue(const char* value) {
  return value != nullptr && value[0] != '\0' && strstr(value, "YOUR_") == nullptr;
}

inline bool wifiConfigured() {
  return TIGER_CAMERA_HAS_SECRETS && hasRealValue(wifiSsid);
}

inline bool uploadConfigured() {
  return wifiConfigured() && hasRealValue(apiBaseUrl) &&
         hasRealValue(deviceCredential) && strlen(deviceCredential) >= 32 &&
         strstr(tlsRootCaPem, "BEGIN CERTIFICATE") != nullptr;
}

}  // namespace DeviceConfig
