#pragma once

#include <Adafruit_ST7735.h>
#include <Arduino.h>

// Adafruit GFX 內建字型使用整數倍率。
// 集中命名後，各畫面不直接散落 1、2、3；若面板版面改變，只需調整這裡。
enum class DisplayTextSize : uint8_t {
  Small = 1,
  Medium = 2,
  Large = 3,
};

class DisplayController {
 public:
  DisplayController();

  void begin();
  void showColorTest();
  bool drawJpeg(const uint8_t* data, size_t length);
  void showStatus(const char* heading, const char* detail = nullptr);
  void showClaimCode(const char* code);

  void showSplashPage(const char* title, const char* author);
  void showBootLogPage();
  void appendBootLog(const char* label, const char* status, int percent);

 private:
  static bool jpegBlock(int16_t x, int16_t y, uint16_t width,
                        uint16_t height, uint16_t* bitmap);
  void drawCenteredText(const char* text, DisplayTextSize size, int16_t centerY,
                        uint16_t color);
  static DisplayController* active_;

  Adafruit_ST7735 tft_;
  uint16_t* frameBuffer_ = nullptr;
  uint16_t jpegScaledWidth_ = 0;
  uint16_t jpegScaledHeight_ = 0;
  uint16_t jpegCropX_ = 0;
  uint16_t jpegCropWidth_ = 0;
};
