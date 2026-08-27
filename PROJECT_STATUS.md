# Project Status

更新日期：2026-08-24

## 結論

Tiger Camera 已完成 Gate H1、L0、W0、I0 與 P0 的功能驗收。2026-08-24 使用者以 Android Chrome 實測領取、Canvas 後製、私人與公開下載、發布、相簿、管理員永久刪除及 NFC 固定網址流程皆通過；2026-08-28 使用者確認 P0 電池供電、充電、升壓、開關與 P0.1 電量顯示均完成。iPhone Safari 移到 R0 發布前相容性檢查；目前進入 E0 外殼階段。

## 已確認硬體

- AroundTW／GOOUUU ESP32-S3-CAM
- ESP32-S3-WROOM-1-N16R8：16 MB Flash、8 MB PSRAM
- OV2640，PID `0x26`
- ST7735 SPI，實際解析度 `128x128`；面板實際對角尺寸與 PCB 外形仍須量測
- 快門 GPIO1，閒置 HIGH、按下接 GND
- 兩腳面板固定式自復位按鈕 `060009`（接點標示 `125V 3A`）已接 GPIO1／GND 實測；按一下成功拍照且放開復位，可在 E0 正式外殼選用。四腳輕觸按鈕版本仍保留。
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

> Gate L0 的功能流程已通過；30 次完整上傳、5 次斷線恢復及固定 upload token 輪替仍列為發布前的量化強化測試，不能冒充已完成的實測紀錄。

## 下一步

1. **E0**：量測全部零件及面板式快門按鈕後，製作基本矩形外殼。
2. **R0**：iPhone Safari 相容性、壓力／斷線／token 輪替測試與草稿、R2 物件清理證據。

## 單一裝置驗證決策

- 2026-08-24 改為單一固定高熵 `DEVICE_UPLOAD_TOKEN`；Backend 以 constant-time 比對 Bearer token，不再查詢 `devices`。
- 同一值只放在 Vercel／Backend `.env.local` 與被 Git 忽略的韌體 `secrets.h`。Frontend 不保存、顯示或取得此 token。
- `/admin` 已移除建立、列出與撤銷裝置流程，只保留管理員登入與公開照片永久刪除。
- 不採用「只要連上任意 Wi-Fi 就能匿名上傳」。若 token 外洩，需同時輪替 Backend 與韌體的值；舊 token 應立即得到 `401`。
- production Neon 在部署新版 Backend 前先執行 `002_fixed_device_upload_token.sql`；歷史 `devices` 與 `photo.device_id` 暫時保留但不再被程式讀寫，避免破壞既有照片。

## Gate P0（已通過）

- 2026-08-28 使用者確認 P0 整體實作、測試與整理完成。
- 已完成的供電路徑為：803040→TP4056→KCD1-11→MT3608→主板；相機可由電池供電完成拍照與上傳。
- 電池為帶保護板的 803040 3.7V 1000mAh（8.0±0.3 × 30±0.5 × 40±1 mm）。商品規格為標準充電 0.5C／500mA、最大充電 1C／1A、最大放電 1C／1A；保護 IC 允許最大電流 2A。
- TP4056 Type-C 充電保護板採商品預設 1A，不修改電阻；MT3608 輸出已調為 5.0V。
- 電池與 TP4056 採導線直焊，不使用 JST-PH 2.0；焊接只接電池既有導線／保護板輸出端，不接裸電芯極耳。
- 本方案不支援邊充邊用：充電時關閉開關切斷 MT3608，使用時拔除 USB-C 再開機。
- **P0.1 已通過（2026-08-28，使用者實機確認）**：GPIO3（ADC1_CH2）的 100kΩ／100kΩ 電池分壓、TFT 電壓與 LiPo 曲線估算百分比均正常。DT-830D 為 4.00V、未校正 TFT 為 3.80V，因此套用 `1.0526` 校正係數；重新燒錄後兩者讀值一致，電量資訊已靠右顯示且不使用黑底。GPIO3 是 strapping pin，任何日後開機異常都先拆除分壓線。

## 阻塞

- 無功能性阻塞。
- 外殼仍須先量測所有實物尺寸與面板式快門按鈕開孔，P0 電源配置已不再阻擋 E0。
