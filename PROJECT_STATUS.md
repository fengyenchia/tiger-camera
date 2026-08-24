# Project Status

更新日期：2026-08-24

## 結論

Tiger Camera 已完成 Gate H1 與 Gate L0 的功能驗收，現在正式進入 W0／I0。使用者已確認固定 XGA 拍照與螢幕沒有問題；Web 已完成公開照片卡片下載按鈕與 Backend 直接附件下載路由，下一步是部署後的 iPhone／Android 與 NFC 實機驗收。

## 已確認硬體

- AroundTW／GOOUUU ESP32-S3-CAM
- ESP32-S3-WROOM-1-N16R8：16 MB Flash、8 MB PSRAM
- OV2640，PID `0x26`
- ST7735 SPI，實際解析度 `128x128`；面板實際對角尺寸與 PCB 外形仍須量測
- 快門 GPIO1，閒置 HIGH、按下接 GND
- 顯示設定：`INITR_144GREENTAB`、BGR、`invertDisplay(false)`；RGB 色序與方形即時預覽已確認
- 相機設定：固定 XGA `1024x768`、JPEG quality 8、brightness +1、contrast -1、saturation 0、AE level +2、gain ceiling 8x

## 已通過

### Gate H1

- 相機初始化、即時預覽、快門與拍照回顧正常。
- JPEG 會複製到自有 PSRAM；下一次成功拍照才覆蓋。
- 原先 128×160 設定已淘汰；修正為 128×128 後的 RGB 色序與方形即時預覽已重新確認。
- 先前基線的 10 次冷啟動與 30 次連續拍照已通過。

### Gate L0（功能驗收）

- 連線至 2.4 GHz 熱點／Wi-Fi。
- ESP32 取得短效 R2 PUT URL 並完成 JPEG 上傳。
- Backend 建立私人草稿並回傳 6 位領取碼。
- 螢幕與 Serial 顯示同一組領取碼。
- 使用者可在網站領取原圖、Canvas 後製、下載並選擇公開。
- 私人原圖由 Backend 驗證 claim token 後代理回傳，避免瀏覽器直接讀 R2 的 CORS 問題。
- 公開後跳轉相簿，公開照片可用 overlay 放大。
- 每張公開照片卡片都有下載按鈕；`GET /api/photos/:id/image?download=1` 由 Backend 直接回傳 JPEG attachment，不再依賴跨網域 redirect 觸發下載。

> Gate L0 的功能流程已通過；30 次完整上傳、5 次斷線恢復及裝置憑證撤銷仍列為發布前的量化強化測試，不能冒充已完成的實測紀錄。

## 下一步

1. **W0**：部署最新前後端，完成 iOS Safari／Android Chrome 的領取、Canvas 亮度與輸出、公開照片直接下載、發布、相簿與管理員刪除矩陣。
2. **I0**：把 NFC 寫成固定 `/create` 網址，以 iPhone／Android 驗證掃描位置、開啟與手動網址備援；驗收前不要永久鎖定。
3. **P0**：外接有保護的 3.7V 單節鋰電池與 5V 充電升壓模組；完成極性、輸出、壓降、溫升、低壓截止與續航測試。
4. **E0**：量測全部零件後做基本矩形外殼。
5. **R0**：壓力／斷線／撤銷測試與草稿、R2 物件清理證據。

## P0 尚未鎖定的事

- 候選電池為帶保護板的 803040 3.7V 800mAh；購買前仍須確認實際尺寸、接頭、極性與電芯允許充電電流。
- 候選模組為賣場的 5V 2A／2.4A 單節鋰電池充電升壓模組；2.4A 是標稱最大值，不視為已驗證連續輸出。
- V1 初版只使用模組 LED 判斷充電狀態，不在 TFT 顯示虛構的電量百分比。若日後要顯示電量，需另加分壓／fuel gauge 與 ADC 校正。

## 阻塞

- 無功能性阻塞。
- 外殼仍被實物尺寸與 P0 電源配置阻塞，這是刻意保留的正確順序。
