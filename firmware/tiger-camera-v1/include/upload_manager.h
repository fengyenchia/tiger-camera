#pragma once

#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

class NetworkManager;

enum class UploadPhase : uint8_t {
  idle,
  waitingForWifi,
  waitingForTime,
  initiating,
  uploading,
  completing,
  retrying,
  ready,
  configurationError,
  authenticationError,
  serverRejected,
  memoryError,
};

struct UploadStatus {
  UploadPhase phase = UploadPhase::idle;
  uint32_t generation = 0;
  unsigned long retryInMs = 0;
};

class UploadManager {
 public:
  bool begin(NetworkManager* network);
  bool queuePhoto(const uint8_t* jpeg, size_t length, uint16_t width,
                  uint16_t height, uint32_t capturedMillis,
                  uint32_t* generation);
  UploadStatus status() const;
  bool takeClaimCode(uint32_t* generation, char* claimCode,
                     size_t claimCodeLength, char* expiresAt,
                     size_t expiresAtLength);

 private:
  struct UploadJob;

  static void taskEntry(void* argument);
  void taskLoop();
  UploadJob* takePending();
  bool newerPhotoWaiting(uint32_t generation) const;
  bool waitBeforeRetry(unsigned long delayMs, uint32_t generation);
  void setStatus(UploadPhase phase, uint32_t generation,
                 unsigned long retryInMs = 0);
  void publishClaim(uint32_t generation, const String& code,
                    const String& expiresAt);
  void releaseJob(UploadJob* job);

  NetworkManager* network_ = nullptr;
  mutable SemaphoreHandle_t mutex_ = nullptr;
  TaskHandle_t task_ = nullptr;
  UploadJob* pending_ = nullptr;
  uint32_t nextGeneration_ = 0;
  UploadStatus status_;
  bool claimPending_ = false;
  uint32_t claimGeneration_ = 0;
  char claimCode_[7] = {};
  char claimExpiresAt_[25] = {};
};
