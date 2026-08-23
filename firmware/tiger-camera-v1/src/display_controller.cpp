#include "display_controller.h"

#include <TJpg_Decoder.h>
#include "esp_heap_caps.h"

#include "app_config.h"
#include "board_pins.h"

DisplayController* DisplayController::active_ = nullptr;

DisplayController::DisplayController()
    : tft_(BoardPins::tftChipSelect, BoardPins::tftDataCommand,
           BoardPins::tftMosi, BoardPins::tftClock, BoardPins::tftReset) {}

void DisplayController::begin() {
  active_ = this;
  // The tested 128 x 160 module renders native RED as blue with BLACKTAB.
  // REDTAB keeps the same geometry but selects the panel's required BGR order.
  tft_.initR(INITR_REDTAB);
  // Keep the tested upright text orientation. JPEG orientation is handled
  // independently so display messages do not rotate with the photo.
  tft_.setRotation(0);
  tft_.invertDisplay(AppConfig::displayInverted);
  tft_.fillScreen(ST77XX_BLACK);
  tft_.setTextWrap(true);

  const size_t bufferBytes =
      static_cast<size_t>(tft_.width()) * tft_.height() * sizeof(uint16_t);
  frameBuffer_ = static_cast<uint16_t*>(
      heap_caps_malloc(bufferBytes, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));

  // TJpg_Decoder's byte swap is intended for TFT_eSPI; Adafruit GFX receives
  // the decoder's RGB565 blocks directly.
  TJpgDec.setSwapBytes(false);
  TJpgDec.setCallback(jpegBlock);
}

void DisplayController::showColorTest() {
  const int16_t barWidth = tft_.width() / 4;
  tft_.fillRect(0, 0, barWidth, tft_.height(), ST77XX_RED);
  tft_.fillRect(barWidth, 0, barWidth, tft_.height(), ST77XX_GREEN);
  tft_.fillRect(barWidth * 2, 0, barWidth, tft_.height(), ST77XX_BLUE);
  tft_.fillRect(barWidth * 3, 0, tft_.width() - barWidth * 3, tft_.height(),
                ST77XX_WHITE);
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

  if (frameBuffer_ == nullptr) {
    Serial.println("[display] frame buffer allocation failed");
    Serial0.println("[display] frame buffer allocation failed");
    return false;
  }

  // Keep the JPEG orientation. Decode at a scale that preserves enough height,
  // then center-crop 4:3 to the display's 4:5 portrait aspect ratio.
  uint8_t scale = 1;
  while (scale < 8 &&
         imageHeight > static_cast<uint16_t>(tft_.height() * scale)) {
    scale *= 2;
  }

  const int16_t scaledWidth = (imageWidth + scale - 1) / scale;
  const int16_t scaledHeight = (imageHeight + scale - 1) / scale;
  jpegScaledWidth_ = scaledWidth;
  jpegScaledHeight_ = scaledHeight;
  jpegCropWidth_ = static_cast<uint16_t>(
      static_cast<uint32_t>(scaledHeight) * tft_.width() / tft_.height());
  if (jpegCropWidth_ > jpegScaledWidth_) {
    jpegCropWidth_ = jpegScaledWidth_;
  }
  jpegCropX_ = (jpegScaledWidth_ - jpegCropWidth_) / 2;

  const size_t pixelCount =
      static_cast<size_t>(tft_.width()) * tft_.height();
  memset(frameBuffer_, 0, pixelCount * sizeof(uint16_t));
  TJpgDec.setJpgScale(scale);
  const bool decoded = TJpgDec.drawJpg(0, 0, data, length) == JDR_OK;
  if (decoded) {
    tft_.drawRGBBitmap(0, 0, frameBuffer_, tft_.width(), tft_.height());
  }
  return decoded;
}

void DisplayController::showStatus(const char* heading, const char* detail) {
  tft_.fillScreen(ST77XX_BLACK);
  const uint8_t headingSize = strlen(heading) <= 10 ? 2 : 1;
  const int16_t headingY = detail == nullptr ? tft_.height() / 2
                                              : tft_.height() / 2 - 12;
  drawCenteredText(heading, headingSize, headingY, ST77XX_YELLOW);

  if (detail != nullptr) {
    drawCenteredText(detail, 1, tft_.height() / 2 + 12, ST77XX_WHITE);
  }
}

void DisplayController::showClaimCode(const char* code) {
  tft_.fillScreen(ST77XX_BLACK);
  drawCenteredText("CLAIM CODE", 1, 45, ST77XX_WHITE);
  drawCenteredText(code, 3, 78, ST77XX_YELLOW);
  drawCenteredText("VALID 24H", 1, 112, ST77XX_WHITE);
}

void DisplayController::drawCenteredText(const char* text, uint8_t size,
                                         int16_t centerY, uint16_t color) {
  int16_t boundsX = 0;
  int16_t boundsY = 0;
  uint16_t boundsWidth = 0;
  uint16_t boundsHeight = 0;
  tft_.setTextSize(size);
  tft_.setTextColor(color);
  tft_.getTextBounds(text, 0, 0, &boundsX, &boundsY, &boundsWidth,
                     &boundsHeight);
  const int16_t cursorX = (tft_.width() - boundsWidth) / 2 - boundsX +
                          AppConfig::displayTextOffsetX;
  const int16_t cursorY = centerY - boundsHeight / 2 - boundsY +
                          AppConfig::displayTextOffsetY;
  tft_.setCursor(cursorX, cursorY);
  tft_.print(text);
}

bool DisplayController::jpegBlock(int16_t x, int16_t y, uint16_t width,
                                  uint16_t height, uint16_t* bitmap) {
  if (active_ == nullptr || active_->frameBuffer_ == nullptr) {
    return false;
  }

  const int16_t targetWidth = active_->tft_.width();
  const int16_t targetHeight = active_->tft_.height();
  for (uint16_t row = 0; row < height; ++row) {
    for (uint16_t column = 0; column < width; ++column) {
      const int16_t sourceX = x + column;
      const int16_t sourceY = y + row;
      if (sourceX < active_->jpegCropX_ ||
          sourceX >= active_->jpegCropX_ + active_->jpegCropWidth_ ||
          sourceY >= active_->jpegScaledHeight_) {
        continue;
      }

      // Scale the center-cropped 96 x 120 image to the full 128 x 160 panel.
      const int16_t croppedX = sourceX - active_->jpegCropX_;
      const int16_t destinationXStart =
          croppedX * targetWidth / active_->jpegCropWidth_;
      const int16_t destinationXEnd =
          ((croppedX + 1) * targetWidth / active_->jpegCropWidth_) - 1;
      const int16_t destinationYStart =
          sourceY * targetHeight / active_->jpegScaledHeight_;
      const int16_t destinationYEnd =
          ((sourceY + 1) * targetHeight / active_->jpegScaledHeight_) - 1;
      const uint16_t color = bitmap[row * width + column];

      for (int16_t destinationY = destinationYStart;
           destinationY <= destinationYEnd; ++destinationY) {
        for (int16_t destinationX = destinationXStart;
             destinationX <= destinationXEnd; ++destinationX) {
          active_->frameBuffer_[destinationY * targetWidth + destinationX] =
              color;
        }
      }
    }
  }
  return true;
}
