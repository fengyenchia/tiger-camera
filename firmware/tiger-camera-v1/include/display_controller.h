#pragma once

#include <Adafruit_ST7735.h>
#include <Arduino.h>

class DisplayController {
 public:
  DisplayController();

  void begin();
  void showColorTest();
  bool drawJpeg(const uint8_t* data, size_t length);
  void showStatus(const char* heading, const char* detail = nullptr);

 private:
  static bool jpegBlock(int16_t x, int16_t y, uint16_t width,
                        uint16_t height, uint16_t* bitmap);
  void drawCenteredText(const char* text, uint8_t size, int16_t centerY,
                        uint16_t color);
  static DisplayController* active_;

  Adafruit_ST7735 tft_;
  uint16_t* frameBuffer_ = nullptr;
  uint16_t jpegScaledWidth_ = 0;
  uint16_t jpegScaledHeight_ = 0;
  uint16_t jpegCropX_ = 0;
  uint16_t jpegCropWidth_ = 0;
};
