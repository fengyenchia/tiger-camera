#include "display_controller.h"

#include <TJpg_Decoder.h>
#include "esp_heap_caps.h"

#include "app_config.h"
#include "board_pins.h"

namespace DisplayLayout {

// 啟動畫面：品牌內容整組往上移一點。
constexpr int16_t kSplashTitleY = 56;
constexpr int16_t kSplashAuthorY = 86;

// 一般狀態頁：標題與說明一起往下移一點。
constexpr int16_t kStatusHeadingOffsetY = -8;
constexpr int16_t kStatusDetailOffsetY = 16;

// 領取碼頁的固定垂直位置。
constexpr int16_t kClaimLabelY = 30;
constexpr int16_t kClaimCodeY = 64;
constexpr int16_t kClaimExpiryY = 97;

}  // namespace DisplayLayout

DisplayController* DisplayController::active_ = nullptr;

DisplayController::DisplayController()
    : tft_(BoardPins::tftChipSelect, BoardPins::tftDataCommand,
           BoardPins::tftMosi, BoardPins::tftClock, BoardPins::tftReset) {}

void DisplayController::begin() {
  active_ = this;
  // The tested 1.44-inch ST7735 is a 128 x 128 green-tab panel. This option
  // sets the correct square geometry, BGR order, and active-area offset.
  tft_.initR(INITR_144GREENTAB);
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

  // Keep the JPEG orientation. Choose the largest decoder scale whose output
  // is still at least as tall as the panel, then downsample while drawing.
  // Decode XGA to 256 x 192 before the final resize, then centre-crop it to a
  // square. Decoding directly to 128 x 96 made the preview visibly soft.
  uint8_t scale = 1;
  while (scale < 8 &&
         imageHeight >=
             static_cast<uint16_t>(tft_.height() * scale * 2)) {
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

void DisplayController::showBatteryOverlay(float volts, uint8_t percent,
                                           bool valid) {
  char label[16] = {};
  if (valid) {
    snprintf(label, sizeof(label), "%.2fV %u%%", volts,
             static_cast<unsigned>(percent));
  } else {
    strlcpy(label, "BAT --", sizeof(label));
  }

  tft_.setTextSize(static_cast<uint8_t>(DisplayTextSize::Small));
  tft_.setTextColor(valid ? ST77XX_YELLOW : ST77XX_RED);

  int16_t boundsX = 0;
  int16_t boundsY = 0;
  uint16_t boundsWidth = 0;
  uint16_t boundsHeight = 0;
  tft_.getTextBounds(label, 0, 0, &boundsX, &boundsY, &boundsWidth,
                     &boundsHeight);
  const int16_t cursorX = tft_.width() - boundsWidth - boundsX - 3;
  const int16_t cursorY = tft_.height() - boundsHeight - boundsY - 3;
  tft_.setCursor(cursorX, cursorY);
  tft_.print(label);
}

// 顯示一般狀態：短標題使用大字，較長標題使用中號字，避免超出 128px 寬度。
void DisplayController::showStatus(const char* heading, const char* detail) {
  tft_.fillScreen(ST77XX_BLACK);
  const DisplayTextSize headingSize = strlen(heading) <= 7
                                          ? DisplayTextSize::Large
                                          : DisplayTextSize::Medium;
  const int16_t headingY = tft_.height() / 2 +
                           (detail == nullptr ? 0
                                               : DisplayLayout::kStatusHeadingOffsetY);

  drawCenteredText(heading, headingSize, headingY, ST77XX_YELLOW);

  if (detail != nullptr) {
    drawCenteredText(detail, DisplayTextSize::Small,
                     tft_.height() / 2 + DisplayLayout::kStatusDetailOffsetY,
                     ST77XX_WHITE);
  }
}

// 顯示領取碼：領取碼使用大字，其他提示使用小字。
void DisplayController::showClaimCode(const char* code) {
  tft_.fillScreen(ST77XX_BLACK);

  // 文字位置配合 128x128 螢幕，並保留右上／左下微調設定。
  drawCenteredText("CLAIM CODE", DisplayTextSize::Small,
                   DisplayLayout::kClaimLabelY, ST77XX_WHITE);
  drawCenteredText(code, DisplayTextSize::Large, DisplayLayout::kClaimCodeY,
                   ST77XX_YELLOW);
  drawCenteredText("VALID 24H", DisplayTextSize::Small,
                   DisplayLayout::kClaimExpiryY, ST77XX_WHITE);
}

void DisplayController::drawCenteredText(const char* text, DisplayTextSize size,
                                         int16_t centerY, uint16_t color) {
  int16_t boundsX = 0;
  int16_t boundsY = 0;
  uint16_t boundsWidth = 0;
  uint16_t boundsHeight = 0;
  tft_.setTextSize(static_cast<uint8_t>(size));
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


// 啟動畫面：品牌標題與作者。
void DisplayController::showSplashPage(const char* title, const char* author) {
  tft_.fillScreen(ST77XX_BLACK);

  // 標題使用中號字，作者使用小號字。
  drawCenteredText(title, DisplayTextSize::Medium,
                   DisplayLayout::kSplashTitleY, ST77XX_YELLOW);
  if (author != nullptr) {
    drawCenteredText(author, DisplayTextSize::Small,
                     DisplayLayout::kSplashAuthorY, ST77XX_WHITE);
  }
}

// 開機日誌頁：固定標題、分隔線、日誌區與進度條。
static int currentLogY = 40;

void DisplayController::showBootLogPage() {
  tft_.fillScreen(ST77XX_BLACK);
  currentLogY = 40;

  // 頂部標題。
  drawCenteredText("BOOTING", DisplayTextSize::Medium, 18, ST77XX_CYAN);

  // 標題與日誌區的分隔線。
  tft_.drawFastHLine(10, 28, 108, ST77XX_WHITE);

  // 底部進度條外框。
  tft_.drawRect(10, 112, 108, 8, ST77XX_WHITE);
}

// 顯示一行開機日誌，並更新底部進度條。
void DisplayController::appendBootLog(const char* label, const char* status, int percent) {
  tft_.setTextSize(static_cast<uint8_t>(DisplayTextSize::Small));
  tft_.setTextColor(ST77XX_WHITE);
  tft_.setCursor(10, currentLogY);
  tft_.print("> ");
  tft_.print(label);

  // 狀態文字使用黃色區分。
  tft_.setCursor(95, currentLogY);
  tft_.setTextColor(ST77XX_YELLOW);
  tft_.print(status);

  // 每行日誌間隔 16px。
  currentLogY += 16;

  // 依百分比填滿進度條。
  const int fillWidth = (percent * 104) / 100;
  if (fillWidth > 0) {
    tft_.fillRect(12, 114, fillWidth, 4, ST77XX_YELLOW);
  }
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

      // Scale the centre-cropped square image to the full 128 x 128 panel.
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
