#pragma once

#include <Arduino.h>

class NetworkManager {
 public:
  void begin();
  void loop();

  bool configured() const;
  bool connected() const;
  bool clockReady() const;
  bool formatCapturedAt(uint32_t capturedMillis, char* output,
                        size_t outputLength) const;

 private:
  void startConnection();
  void scheduleRetry(unsigned long now);

  bool configured_ = false;
  bool connecting_ = false;
  bool clockStarted_ = false;
  bool wasConnected_ = false;
  unsigned long attemptStartedMs_ = 0;
  unsigned long nextAttemptMs_ = 0;
  unsigned long retryDelayMs_ = 0;
};
