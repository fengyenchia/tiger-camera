# Firmware

此目錄保留給 AroundTW／GOOUUU ESP32-S3-CAM N16R8＋OV2640 V1 韌體。

開始實作前先完成：

1. 記錄實際 PCB、ESP32-S3-WROOM-1-N16R8 與 OV2640 標示。
2. 獨立跑通 camera 與 ST7735 範例。
3. 依 [硬體與腳位規劃](../docs/hardware.md) 完成相機、ST7735、快門與 PSRAM 最新照片共存 Gate。

預計使用 PlatformIO 管理 Arduino-ESP32 專案；實作時再依相容性鎖定套件版本。

V1 不建立相機 AP 或區域網站，因此不需要 `data/` 取圖頁面。韌體以 Wi-Fi station 連接不進 Git 的 2.4 GHz 手機熱點／可信任 Wi-Fi，使用可撤銷的 device-scoped credential 上傳私人原圖草稿；Server 確認後將領取碼回傳給裝置並顯示於 ST7735。NFC 固定指向 `https://tiger-camera.fengyenchia.com/create`。ESP32 不得保存管理員 JWT、R2／Neon credentials 或其他全域雲端密鑰。
