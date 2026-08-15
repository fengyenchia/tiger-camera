# Tiger Camera V1 firmware — Gate H1

這是 AroundTW／GOOUUU ESP32-S3-CAM（ESP32-S3-WROOM-1-N16R8＋OV2640）的正式 PlatformIO 韌體。目前只實作 Gate H1，不包含 Wi-Fi 或 API 上傳。

## 已實作

- OV2640 與 ST7735 同時初始化。
- 240 × 240 JPEG 即時預覽。
- GPIO1 快門，使用 `INPUT_PULLUP` 與 35 ms debounce。
- 拍照時切換至 XGA 1024 × 768 JPEG。
- 先將 camera framebuffer 複製到自有 PSRAM，再歸還 framebuffer。
- 新配置成功後才原子替換上一張照片；失敗保留舊照片。
- mutex 保護最新 JPEG，供顯示與下一階段上傳共用。
- 拍後回看 3.5 秒，不顯示隨機文字。
- Serial 輸出 Flash、PSRAM、JPEG 大小與剩餘 PSRAM。

## 已確認硬體容量

2026-08-16 實機輸出：

- Flash：16,777,216 bytes（16 MB）。
- PSRAM：成功啟用。
- PSRAM：8,388,608 bytes（8 MB）。
- 啟動時可用 PSRAM：8,384,788 bytes。

## 接線

| 功能 | GPIO／接法 |
|---|---|
| TFT SCL | GPIO47 |
| TFT SDA | GPIO21 |
| TFT DC | GPIO14 |
| TFT CS | GND |
| TFT RES | 主板 RST |
| TFT VCC | 依模組標示接 3.3 V／5 V；以已實測接法優先 |
| TFT GND | GND |
| TFT BLK | 依模組標示接 3.3 V／5 V；以已實測接法優先 |
| 快門 | GPIO1 與 GND 之間；程式使用內部上拉 |

GPIO1 仍是 Gate H1 候選，完成冷開機與連拍測試前不能鎖進 PCB。

## 建置

1. 安裝 VS Code PlatformIO extension 或 PlatformIO Core。
2. 以 PlatformIO 開啟此資料夾。
3. 執行 Build。
4. 連接已確認可燒錄的 USB-C，執行 Upload。
5. 以 115200 baud 開啟 Serial Monitor。

```powershell
cd firmware/tiger-camera-v1
pio run
pio run --target upload
pio device monitor
```

![typeC比較](image.png)

Repository 已以 PlatformIO Core 6.1.19、Espressif32 platform 7.0.1、Arduino-ESP32 2.0.17 完成 production build。專案內含 N16R8 自訂 board 定義，讓 build／upload 明確使用 16 MB Flash 與 8 MB OPI PSRAM；實體 upload 仍需由你連接開發板執行。

## 實機驗收

1. Serial 顯示 16 MB Flash 與 8 MB PSRAM。
2. Camera 與 TFT 都成功初始化。
3. 即時預覽方向、色序與畫面位置正確。
4. 短按快門後顯示剛拍的照片約 3.5 秒。
5. 連拍 30 次，PSRAM 不持續下降，無壞圖、花屏或 reset。
6. 冷開機 10 次，GPIO1 快門不影響啟動。
7. 模擬一次配置失敗時，上一張有效照片仍可保留。

若預覽色序不正確，先只切換 `display_controller.cpp` 的
`TJpgDec.setSwapBytes(false)` 為 `true` 後重測；若畫面偏移，再確認螢幕實際
tab 類型與 `INITR_BLACKTAB`。這兩項必須以收到的 ST7735 實物為準。

Gate H1 通過後，才加入 `secrets.h`、Wi-Fi 重連與 `initiate → R2 PUT → complete`。`secrets.example.h` 只是欄位範本；真實 `secrets.h` 已被 repository 根目錄 `.gitignore` 排除。
