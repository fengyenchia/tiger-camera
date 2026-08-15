#pragma once

#include <Arduino.h>

class ShutterButton {
 public:
  ShutterButton(int pin, unsigned long debounceMs)
      : pin_(pin), debounceMs_(debounceMs) {}

  void begin() {
    pinMode(pin_, INPUT_PULLUP);
    rawPressed_ = digitalRead(pin_) == LOW;
    stablePressed_ = rawPressed_;
    lastChangeMs_ = millis();
  }

  bool pressed() {
    const bool nextRaw = digitalRead(pin_) == LOW;
    const unsigned long now = millis();
    if (nextRaw != rawPressed_) {
      rawPressed_ = nextRaw;
      lastChangeMs_ = now;
    }

    if (rawPressed_ != stablePressed_ && now - lastChangeMs_ >= debounceMs_) {
      stablePressed_ = rawPressed_;
      return stablePressed_;
    }
    return false;
  }

 private:
  int pin_;
  unsigned long debounceMs_;
  bool rawPressed_ = false;
  bool stablePressed_ = false;
  unsigned long lastChangeMs_ = 0;
};

