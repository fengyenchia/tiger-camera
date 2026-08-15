#include "display_controller.h"

#include <TJpg_Decoder.h>

#include "board_pins.h"

DisplayController* DisplayController::active_ = nullptr;

DisplayController::DisplayController()
    : tft_(BoardPins::tftChipSelect, BoardPins::tftDataCommand,
           BoardPins::tftMosi, BoardPins::tftClock, BoardPins::tftReset) {}

void DisplayController::begin() {
  active_ = this;
  tft_.initR(INITR_BLACKTAB);
  tft_.setRotation(1);
  tft_.fillScreen(ST77XX_BLACK);
  tft_.setTextWrap(true);

  // TJpg_Decoder's byte swap is intended for TFT_eSPI; Adafruit GFX receives
  // the decoder's RGB565 blocks directly.
  TJpgDec.setSwapBytes(false);
  TJpgDec.setCallback(jpegBlock);
}

bool DisplayController::drawJpeg(const uint8_t* data, size_t length) {
  if (data == nullptr || length == 0) {
    return false;
  }

  uint16_t imageWidth = 0;
  uint16_t imageHeight = 0;
  if (TJpgDec.getJpgSize(&imageWidth, &imageHeight, data, length) != JDR_OK) {
    Serial.println("[display] invalid JPEG");
    return false;
  }

  uint8_t scale = 1;
  while (scale < 8 &&
         (imageWidth > static_cast<uint16_t>(tft_.width() * scale) ||
          imageHeight > static_cast<uint16_t>(tft_.height() * scale))) {
    scale *= 2;
  }

  const int16_t scaledWidth = (imageWidth + scale - 1) / scale;
  const int16_t scaledHeight = (imageHeight + scale - 1) / scale;
  const int16_t originX = scaledWidth < tft_.width()
                              ? (tft_.width() - scaledWidth) / 2
                              : 0;
  const int16_t originY = scaledHeight < tft_.height()
                              ? (tft_.height() - scaledHeight) / 2
                              : 0;

  tft_.fillScreen(ST77XX_BLACK);
  TJpgDec.setJpgScale(scale);
  return TJpgDec.drawJpg(originX, originY, data, length) == JDR_OK;
}

void DisplayController::showStatus(const char* heading, const char* detail) {
  tft_.fillScreen(ST77XX_BLACK);
  tft_.setTextColor(ST77XX_YELLOW);
  tft_.setTextSize(2);
  tft_.setCursor(8, 38);
  tft_.println(heading);

  if (detail != nullptr) {
    tft_.setTextColor(ST77XX_WHITE);
    tft_.setTextSize(1);
    tft_.setCursor(8, 72);
    tft_.println(detail);
  }
}

bool DisplayController::jpegBlock(int16_t x, int16_t y, uint16_t width,
                                  uint16_t height, uint16_t* bitmap) {
  if (active_ == nullptr || y >= active_->tft_.height()) {
    return false;
  }
  if (x >= active_->tft_.width()) {
    return true;
  }

  const uint16_t remainingWidth = active_->tft_.width() - x;
  const uint16_t remainingHeight = active_->tft_.height() - y;
  const uint16_t visibleWidth = width < remainingWidth ? width : remainingWidth;
  const uint16_t visibleHeight =
      height < remainingHeight ? height : remainingHeight;

  if (visibleWidth == width) {
    active_->tft_.drawRGBBitmap(x, y, bitmap, visibleWidth, visibleHeight);
  } else {
    for (uint16_t row = 0; row < visibleHeight; ++row) {
      active_->tft_.drawRGBBitmap(x, y + row, bitmap + row * width,
                                  visibleWidth, 1);
    }
  }
  return true;
}

