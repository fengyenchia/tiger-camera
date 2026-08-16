#pragma once

#include <Arduino.h>

class ShutterButton {
 public:
  ShutterButton(int pin, unsigned long debounceMs)
      : pin_(pin), debounceMs_(debounceMs) {}

  void begin();
  bool pressed();
  void discardPending();

 private:
  static void IRAM_ATTR handleInterrupt();
  static ShutterButton* active_;

  int pin_;
  unsigned long debounceMs_;
  volatile bool interruptPending_ = false;
  unsigned long lastAcceptedMs_ = 0;
};
