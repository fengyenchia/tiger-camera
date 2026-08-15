#pragma once

#include <Adafruit_ST7735.h>
#include <Arduino.h>

class DisplayController {
 public:
  DisplayController();

  void begin();
  bool drawJpeg(const uint8_t* data, size_t length);
  void showStatus(const char* heading, const char* detail = nullptr);

 private:
  static bool jpegBlock(int16_t x, int16_t y, uint16_t width,
                        uint16_t height, uint16_t* bitmap);
  static DisplayController* active_;

  Adafruit_ST7735 tft_;
};

