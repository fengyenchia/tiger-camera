# Firmware

此目錄保留給 AroundTW／GOOUUU ESP32-S3-CAM N16R8＋OV2640 V1 韌體。

開始實作前先完成：

1. 記錄實際 PCB、ESP32-S3-WROOM-1-N16R8 與 OV2640 標示。
2. 獨立跑通 camera 與 ST7735 範例。
3. 依 [硬體與腳位規劃](../docs/hardware.md) 完成相機、ST7735、快門與 PSRAM 最新照片共存 Gate。

預計使用 PlatformIO 管理 Arduino-ESP32 專案；實作時再依相容性鎖定套件版本。

正式目錄中的 `data/` 只放燒錄至 ESP32 Flash 的最小區域取圖頁面，提供 `/latest.jpg`、下載與連線說明。登入、雲端 API、相簿與刪除管理全部放在 `web/`，不得把管理員密碼或雲端長期密鑰寫入韌體。
