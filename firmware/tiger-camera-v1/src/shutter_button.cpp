#include "shutter_button.h"

ShutterButton* ShutterButton::active_ = nullptr;

void ShutterButton::begin() {
  pinMode(pin_, INPUT_PULLUP);
  active_ = this;
  lastAcceptedMs_ = millis() - debounceMs_;
  attachInterrupt(digitalPinToInterrupt(pin_), handleInterrupt, FALLING);

  const bool idleHigh = digitalRead(pin_) == HIGH;
  Serial.printf("[shutter] GPIO%d idle=%s\n", pin_, idleHigh ? "HIGH" : "LOW");
  Serial0.printf("[shutter] GPIO%d idle=%s\n", pin_,
                 idleHigh ? "HIGH" : "LOW");
  if (!idleHigh) {
    Serial.println(
        "[shutter] warning: expected HIGH; release button and check GPIO-to-GND wiring");
  }
}

bool ShutterButton::pressed() {
  noInterrupts();
  const bool pending = interruptPending_;
  interruptPending_ = false;
  interrupts();

  if (!pending) {
    return false;
  }

  const unsigned long now = millis();
  if (now - lastAcceptedMs_ < debounceMs_) {
    return false;
  }

  lastAcceptedMs_ = now;
  Serial.printf("[shutter] press latched on GPIO%d\n", pin_);
  Serial0.printf("[shutter] press latched on GPIO%d\n", pin_);
  return true;
}

void ShutterButton::discardPending() {
  noInterrupts();
  interruptPending_ = false;
  interrupts();
}

void IRAM_ATTR ShutterButton::handleInterrupt() {
  if (active_ != nullptr) {
    active_->interruptPending_ = true;
  }
}
