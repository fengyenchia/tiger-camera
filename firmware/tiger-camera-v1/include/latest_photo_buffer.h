#pragma once

#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"

class LatestPhotoBuffer {
 public:
  ~LatestPhotoBuffer();

  bool begin();
  bool replace(const uint8_t* source, size_t length);
  bool lock(TickType_t waitTicks = portMAX_DELAY);
  void unlock();

  const uint8_t* dataUnsafe() const;
  size_t sizeUnsafe() const;

 private:
  uint8_t* data_ = nullptr;
  size_t size_ = 0;
  SemaphoreHandle_t mutex_ = nullptr;
};

