#include "battery_monitor.h"

#include "app_config.h"

BatteryMonitor::BatteryMonitor(int pin) : pin_(pin) {}

void BatteryMonitor::begin() {
  pinMode(pin_, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(pin_, ADC_11db);
  sample();
}

void BatteryMonitor::loop() {
  if (millis() - lastSampleMs_ >= AppConfig::batterySampleIntervalMs) {
    sample();
  }
}

const BatteryReading& BatteryMonitor::reading() const { return reading_; }

void BatteryMonitor::sample() {
  uint32_t totalMillivolts = 0;
  uint8_t validSamples = 0;

  for (uint8_t sampleIndex = 0;
       sampleIndex < AppConfig::batterySampleCount; ++sampleIndex) {
    const uint32_t millivolts = analogReadMilliVolts(pin_);
    if (millivolts > 0) {
      totalMillivolts += millivolts;
      ++validSamples;
    }
    delay(2);
  }

  lastSampleMs_ = millis();
  if (validSamples == 0) {
    reading_.valid = false;
    return;
  }

  const float adcVolts = static_cast<float>(totalMillivolts) /
                        static_cast<float>(validSamples) / 1000.0f;
  const float batteryVolts = adcVolts * AppConfig::batteryDividerRatio *
                             AppConfig::batteryVoltageCalibration;

  // A protected single-cell LiPo should normally be within this range while
  // the camera is powered. Reject a floating/unwired or clearly bad reading.
  if (batteryVolts < 2.90f || batteryVolts > 4.35f) {
    reading_.valid = false;
    return;
  }

  reading_.volts = batteryVolts;
  reading_.percent = estimatePercent(batteryVolts);
  reading_.valid = true;
}

uint8_t BatteryMonitor::estimatePercent(float volts) {
  // This is intentionally an open-circuit LiPo voltage estimate, not a fuel
  // gauge. Under camera/Wi-Fi load the reading can temporarily fall.
  struct Point {
    float volts;
    uint8_t percent;
  };
  constexpr Point curve[] = {
      {4.20f, 100}, {4.10f, 90}, {4.00f, 80}, {3.90f, 65},
      {3.80f, 50},  {3.70f, 30}, {3.60f, 15}, {3.45f, 5},
      {3.30f, 0},
  };

  if (volts >= curve[0].volts) {
    return curve[0].percent;
  }
  constexpr size_t pointCount = sizeof(curve) / sizeof(curve[0]);
  if (volts <= curve[pointCount - 1].volts) {
    return curve[pointCount - 1].percent;
  }

  for (size_t index = 0; index < pointCount - 1; ++index) {
    const Point& upper = curve[index];
    const Point& lower = curve[index + 1];
    if (volts <= upper.volts && volts >= lower.volts) {
      const float ratio = (volts - lower.volts) / (upper.volts - lower.volts);
      return static_cast<uint8_t>(lower.percent +
                                  ratio * (upper.percent - lower.percent) +
                                  0.5f);
    }
  }
  return 0;
}
