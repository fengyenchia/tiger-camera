#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

// 依據剛才接線設定的 GPIO
#define TFT_CS    -1   // CS 接 GND，填 -1
#define TFT_RST   -1   // RST 接主板 RST，填 -1
#define TFT_DC    14   // DC 接 IO14
#define TFT_MOSI  21   // SDA 接 IO21
#define TFT_SCLK  47   // SCL 接 IO47

// 建立螢幕物件（使用指定腳位）
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCLK, TFT_RST);

void setup() {
  Serial.begin(115200);

  // 初始化螢幕（若是紅色/綠色保護貼螢幕，可切換 INITR_REDTAB 或 INITR_GREENTAB）
  tft.initR(INITR_BLACKTAB);

  // 畫面旋轉（0~3，依你想看的方向調整）
  tft.setRotation(1);

  // 刷黑畫面
  tft.fillScreen(ST77XX_BLACK);

  // 顯示測試文字
  tft.setTextColor(ST77XX_GREEN);
  tft.setTextSize(2);
  tft.setCursor(10, 20);
  tft.println("ESP32-S3");
  
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(10, 50);
  tft.println("ST7735 OK!");

  tft.setTextColor(ST77XX_YELLOW);
  tft.setTextSize(1);
  tft.setCursor(10, 80);
  tft.println("Code: 123456");
}

void loop() {
  // 測試完成，主迴圈留空
}