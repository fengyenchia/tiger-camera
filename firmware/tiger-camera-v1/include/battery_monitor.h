#pragma once

#include <Arduino.h>

struct BatteryReading {
  float volts = 0.0f;
  uint8_t percent = 0;
  bool valid = false;
};

class BatteryMonitor {
 public:
  explicit BatteryMonitor(int pin);

  void begin();
  void loop();
  const BatteryReading& reading() const;

 private:
  static uint8_t estimatePercent(float volts);
  void sample();

  int pin_;
  unsigned long lastSampleMs_ = 0;
  BatteryReading reading_;
};
