#include "latest_photo_buffer.h"

#include <cstring>
#include "esp_heap_caps.h"

LatestPhotoBuffer::~LatestPhotoBuffer() {
  if (data_ != nullptr) {
    heap_caps_free(data_);
  }
  if (mutex_ != nullptr) {
    vSemaphoreDelete(mutex_);
  }
}

bool LatestPhotoBuffer::begin() {
  mutex_ = xSemaphoreCreateMutex();
  return mutex_ != nullptr;
}

bool LatestPhotoBuffer::replace(const uint8_t* source, size_t length) {
  if (source == nullptr || length == 0 || mutex_ == nullptr) {
    return false;
  }

  auto* replacement = static_cast<uint8_t*>(
      heap_caps_malloc(length, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (replacement == nullptr) {
    Serial.printf("[photo] PSRAM allocation failed for %u bytes\n",
                  static_cast<unsigned>(length));
    return false;
  }
  memcpy(replacement, source, length);

  if (xSemaphoreTake(mutex_, portMAX_DELAY) != pdTRUE) {
    heap_caps_free(replacement);
    return false;
  }

  uint8_t* previous = data_;
  data_ = replacement;
  size_ = length;
  xSemaphoreGive(mutex_);

  if (previous != nullptr) {
    heap_caps_free(previous);
  }
  return true;
}

bool LatestPhotoBuffer::lock(TickType_t waitTicks) {
  return mutex_ != nullptr && xSemaphoreTake(mutex_, waitTicks) == pdTRUE;
}

void LatestPhotoBuffer::unlock() {
  if (mutex_ != nullptr) {
    xSemaphoreGive(mutex_);
  }
}

const uint8_t* LatestPhotoBuffer::dataUnsafe() const {
  return data_;
}

size_t LatestPhotoBuffer::sizeUnsafe() const {
  return size_;
}

