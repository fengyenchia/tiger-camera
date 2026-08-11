# Tiger Camera V1 開發路線與里程碑

本文件只描述實作順序；目前應做哪一件事，以 [`START_HERE.md`](START_HERE.md) 與 [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) 為準。

## 原則

- 先以測試 JPEG 完成雲端照片生命週期，不等待硬體。
- 第一版硬體以 USB 供電驗證，不先買電池與 microSD。
- 依 ESP32-S3-CAM pinout 避開相機、PSRAM、SD、USB 與 strapping 腳位。
- 相機區域網站與公開雲端網站是兩個不同 origin、兩個不同 build。
- 原圖與後製圖分開保存，任何濾鏡都不得覆寫原圖。
- 無網路時仍可拍照與下載；未完成上傳不得顯示「已永久保存」。
- 基本矩形外殼在電子尺寸、供電與 RF 實測後才畫。
- GIF、影片、公開註冊、多使用者社群、microSD 裝置端相簿與角色外殼不屬於 V1。

## Phase 0：文件與雲端專案骨架

任務：

- 以本文件、`software.md`、`test-plan.md` 與 `PROJECT_STATUS.md` 鎖定同一套 V1。
- 在 `web/` 建立 Next.js App Router 專案。
- 建立環境變數範例，但不提交真實密鑰、管理員密碼或資料庫 URL。
- 建立最小 CI／本機檢查：format、lint、typecheck、test、production build。
- 部署空白頁，將 `tiger-camera.fengyenchia.com` 加入專案並依平台指示設定 DNS。

完成條件：本機與部署環境均能顯示健康檢查頁；production build 通過；Git 中沒有秘密。

## Phase 1：Gate C0 私人雲端相簿

任務：

- 建立 Private Object Storage 與 PostgreSQL。
- 建立 `photos` migration，包含 `uploading／active／deleting` 狀態。
- 完成單一管理員登入與受保護頁面。
- 實作 `POST /api/photos/initiate` 與限定路徑、操作、MIME、大小、有效期的上傳網址。
- 以檔案選擇器上傳原始測試 JPEG，Canvas 產生後製 JPEG，兩者使用不同 pathname。
- 實作 `complete`、相簿列表、私人圖片讀取與單次操作直接永久刪除。
- 清理逾時 `uploading`；永久刪除部分失敗時保留 `deleting` 供重試。

完成條件：

- 一張測試 JPEG 能完成「原圖／後製圖上傳→相簿→單次永久刪除」。
- 未登入者不能列出、讀取、上傳或刪除照片。
- 永久刪除後，兩個物件與 metadata 都不存在。
- 相同 `clientRequestId` 重試不會產生重複照片。

## Phase 2：商品確認與第一批採購

任務：

- 鎖定 ESP32-S3-CAM N16R8＋OV2640 選項，保存賣家 pinout。
- 確認 1.44 吋選項為 ST7735S、128 × 128、SPI；或改買 1.8 吋 128 × 160。
- 先買主板、螢幕、快門與必要線材；不買 ESP32-CAM-MB、電池、microSD 或外殼五金。
- 記錄價格、PCB 尺寸、腳位與供電需求。

完成條件：確認訂單為 ESP32-S3-CAM＋OV2640，且不誤選 OV3660 或舊式 USB 底板。

## Phase 3：Gate H0 單項硬體基準

任務：

- 記錄到貨 PCB、N16R8、OV2640 與螢幕實際標示和尺寸。
- 分別記錄 TTL／OTG USB-C 的燒錄、供電與序列埠行為。
- 以賣家 pinout 跑 OV2640 CameraWebServer 範例。
- 單獨點亮 ST7735，確認解析度、offset、色序與旋轉方向。
- 韌體確認 Flash 與 PSRAM 容量。

完成條件：相機與螢幕可各自連續運作 10 分鐘，且至少一個 USB-C 有可靠燒錄流程。

## Phase 4：Gate H1 GPIO 與最新照片核心

任務：

- 相機取景顯示至 ST7735。
- 加入快門 debounce。
- 將 JPEG 複製到自有 PSRAM buffer，再歸還相機 framebuffer。
- 用 mutex 保護捕捉、顯示與 HTTP 讀取。
- 實作 `LIVE_VIEW → CAPTURING → COPYING → REVIEW` 狀態機。
- 五句隨機文字避免連續重複；錯誤時保留上一張有效照片。

完成條件：冷開機 10 次、連拍 30 次皆無 boot 失敗、花屏、壞圖、use-after-free 或重啟。

## Phase 5：Gate L0 Wi-Fi、區域網站與 NFC

任務：

- 建立 WPA2 AP、DNS、`camera.local` mDNS、Captive Portal 與固定 IP。
- 實作 `/status` 與 `/latest.jpg`，加入防快取 headers；無照片時回 404。
- 在 `firmware/data/` 建立最小區域取圖頁面與下載按鈕。
- 使用 NFC Tools 把 `http://192.168.4.1/latest.jpg` 寫入 NTAG213。
- 下載與拍照同時進行，驗證 mutex 與 buffer 生命週期。

完成條件：iPhone 與 Android 各至少一台能透過固定 IP 或 NFC 下載新照片；新拍照後不顯示舊快取。

## Phase 6：Gate W0 Canvas 與離線待傳

任務：

- 保留原始 Blob，建立包含復古處理、拍攝日期與拍立得邊框的 Canvas 效果及獨立後製 Blob。
- 處理直向、橫向、低光、大圖記憶體與 JPEG 輸出。
- 建立 IndexedDB 待傳佇列與 `pending／uploading／saved／failed` UI。
- 提供原圖、後製圖下載與手動選檔入口。

完成條件：landscape、portrait、low-light fixtures 輸出正確；清楚區分「下載完成」「待上傳」與「已永久保存」。

## Phase 7：Gate I0 相機與雲端整合

任務：

- 公開 HTTPS 頁面在支援的瀏覽器要求 Local Network Access 並讀取 `http://192.168.4.1/latest.jpg`。
- ESP32 回應最小且限定來源的 CORS 設定。
- 取圖後立即寫入 IndexedDB，切換回有網路連線再上傳。
- 接上 `initiate → PUT original／processed → complete` 流程。
- 實作失敗重試、重複請求 idempotency 與明確錯誤訊息。
- 測試「區域頁面下載→公開網站選檔上傳」的必要備援。

完成條件：至少一組 iPhone 與一組 Android 能完成直接或備援流程；斷網不會誤報成功，恢復網路後可以重試。

## Phase 8：Gate P0 電池方案

任務：

- 向賣家確認充電、保護、5 V 升壓、充電電流與負載共享。
- USB 插拔、充電發熱與 Wi-Fi／相機峰值測試。
- 依電池規格限制充電電流；未確認負載共享前不允許邊充邊用。
- 量測續航後才決定電池容量。

完成條件：30 次拍照＋下載不 brownout，電池與升壓板溫度可接受。

## Phase 9：Gate E0 基本外殼與穩定化

任務：

- 1:1 定位板與兩片式矩形功能殼。
- 鏡頭、螢幕、快門、USB、天線與電池維修空間。
- 100 次拍照、斷電、低電量、NFC、多手機與雲端重試情境。

完成條件：裝置可拆修、關鍵元件不被遮擋、重大問題為 0。

## 決策關卡

| Gate | 問題 | 不通過的動作 |
|---|---|---|
| C0 | 私人照片生命週期是否完整且未洩露權限？ | 停止硬體整合，先修 auth、storage、metadata 與刪除一致性 |
| H0 | 是否收到 N16R8＋OV2640，且 USB-C 可燒錄？ | 換貨或修正板型設定，不沿用 AI-Thinker pinout |
| H1 | 相機＋ST7735＋快門＋PSRAM 可共存？ | 降 TFT clock、調整 reset／CS／GPIO 或降低 JPEG 規格 |
| L0 | 區域取圖與 NFC 在 iOS／Android 可用？ | 保留固定 IP 與下載按鈕，Captive Portal／mDNS 只作輔助 |
| W0 | Canvas 與待傳佇列能保留原圖？ | 停止雲端整合，修正 Blob、IndexedDB 與狀態 UI |
| I0 | 相機到雲端在斷網與瀏覽器限制下可恢復？ | 以手動選檔作主流程，直接 Local Network Access 降為增強功能 |
| P0 | 電池供電完整且穩定？ | 補 5 V 升壓／保護或維持 USB 供電 |
| E0 | 殼內 Wi-Fi、散熱與維修性合格？ | 移天線、電池與開孔位置 |

## 目前工作清單

1. 建立 `web/` Next.js 骨架與健康檢查。
2. 部署並設定 `tiger-camera.fengyenchia.com`。
3. 完成 Gate C0 的登入、測試 JPEG、相簿與刪除生命週期。
4. Gate C0 通過後才下單硬體核心驗證包。
5. 到貨後依 Phase 3 至 Phase 7 逐 Gate 前進。
6. 電池、microSD 與外殼維持延後。
