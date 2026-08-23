# Tiger Camera V1 開發路線與里程碑

本文件只描述實作順序；目前應做哪一件事，以 [`START_HERE.md`](START_HERE.md) 與 [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) 為準。

## 原則

- 先以測試 JPEG 完成雲端照片生命週期，不等待硬體。
- 第一版硬體以 USB 供電驗證，不先買電池與 microSD。
- 依 ESP32-S3-CAM pinout 避開相機、PSRAM、SD、USB 與 strapping 腳位。
- ESP32 以 Wi-Fi station 連手機熱點／可信任 Wi-Fi，不建立使用者 AP 或區域照片網站。
- 私人原圖先由裝置上傳；NFC 固定進 `/create`，領取碼只顯示於相機螢幕。
- 原圖只作為私人草稿與瀏覽器後製來源；公開成功或草稿逾期後刪除，永久保存完成圖。
- 無網路時仍可拍照與回看；未完成裝置上傳不得顯示領取碼或「已保存」。
- 基本矩形外殼在電子尺寸、供電與 RF 實測後才畫。
- GIF、影片、公開註冊、多使用者社群、microSD 裝置端相簿與角色外殼不屬於 V1。

## Phase 0：文件與雲端專案骨架

任務：

- 以本文件、`software.md`、`test-plan.md` 與 `PROJECT_STATUS.md` 鎖定同一套 V1。
- 在 `web/frontend/` 與 `web/backend/` 建立兩個 Next.js App Router 專案；以 pnpm workspace 統一執行檢查。
- 建立環境變數範例，但不提交真實密鑰、管理員密碼或資料庫 URL。
- 建立最小 CI／本機檢查：format、lint、typecheck、test、production build。
- 分別部署 Frontend／Backend；Frontend 綁定 `tiger-camera.fengyenchia.com`，Backend 綁定 `api.tiger-camera.fengyenchia.com`，並設定 CORS 與各自的環境變數。

完成條件：本機與部署環境均能顯示健康檢查頁；production build 通過；Git 中沒有秘密。

## Phase 1：Gate C0 私人草稿、領取與公開生命週期

目前狀態（2026-08-16）：所列 Web 程式與 migration 已實作，使用者回報所有 API 已完成開發環境測試；Vercel Production、DNS 與逐項保存清理證據仍待完成。

任務：

- 建立私人 Cloudflare R2 bucket 與 Neon Serverless PostgreSQL。
- 執行已建立的 `devices`／`photos` migration，包含 `uploading／ready／claimed／active／deleting`。
    - uploading：相機正在上傳原圖至 Cloudflare R2。
    - ready：原圖已上傳完畢，產生領取碼，等待使用者領取。
    - claimed：使用者已輸入領取碼，正在手機 Canvas 上進行編輯。
    - active：使用者完成後製並確認公開，照片正式展示於公開相簿。
    - deleting：管理員刪除或逾時清理機制正在將暫存原圖/照片從雲端移除。

- 驗證已實作的 device credential hash、裝置 initiate／complete 與原圖 presigned PUT。
- 驗證已實作的 UNIQUE 6 位明碼、24 小時期限、原子單次領取與 draft-scoped opaque UUID token。
- 以固定測試 JPEG 模擬裝置上傳，於 `/create` 領取後執行 Canvas。
- Claim holder 選擇公開後上傳 processed JPEG；公開相簿頁不需登入。
- 完成單一管理員登入、裝置撤銷、草稿清理與單次操作永久刪除。

完成條件：

- 一張測試 JPEG 能完成「裝置私人上傳→領取碼→手機後製→可選公開→單次永久刪除」。
- 沒有有效 UUID token 不能呼叫草稿 API；UUID token 只能發布同一張照片；管理員 JWT 才能永久刪除。配對碼本身不作為安全邊界。
- 發布後暫存原圖不存在；管理員永久刪除後，完成圖與 metadata 都不存在。
- 相同 `clientRequestId` 重試不會產生重複照片。

## Phase 2：商品確認與第一批採購

任務：

- 鎖定 ESP32-S3-CAM N16R8＋OV2640 選項，保存賣家 pinout。
- 保存原始候選螢幕商品資料；實機已確認韌體使用 ST7735 128 × 160，外殼前補量面板與 PCB 尺寸。
- 先買主板、螢幕、快門與必要線材；不買 ESP32-CAM-MB、電池、microSD 或外殼五金。
- 記錄價格、PCB 尺寸、腳位與供電需求。

完成條件：確認訂單為 ESP32-S3-CAM＋OV2640，且不誤選 OV3660 或舊式 USB 底板。

## Phase 3：Gate H0 單項硬體基準

目前狀態（2026-08-16）：實際標示已記錄，Camera／ST7735 已分別跑通，Flash 16 MB、PSRAM 8 MB 已由韌體讀值確認，2.4 GHz Wi-Fi 已連線；USB-C 角色與規定的連續運作時間仍需補記錄。

任務：

- 記錄到貨 PCB、N16R8、OV2640 與螢幕實際標示和尺寸。
- 分別記錄 TTL／OTG USB-C 的燒錄、供電與序列埠行為。
- 以賣家 pinout 跑 OV2640 CameraWebServer 範例。
- 單獨點亮 ST7735，確認解析度、offset、色序與旋轉方向。
- 韌體確認 Flash 與 PSRAM 容量。

完成條件：相機與螢幕可各自連續運作 10 分鐘，且至少一個 USB-C 有可靠燒錄流程。

## Phase 4：Gate H1 GPIO 與最新照片核心

目前狀態（2026-08-16）：Gate H1 已通過。`firmware/tiger-camera-v1/` 已燒錄，Camera＋ST7735 即時預覽、GPIO1 中斷拍照、VGA JPEG PSRAM 保存與 3～5 秒回看皆已跑通。Serial 確認 OV2640 PID `0x26`、tuning applied、GPIO1 idle HIGH／press latched，以及 20,174-byte JPEG 成功保存後剩餘 8,242,243-byte PSRAM。REDTAB／BGR、inversion off、直式文字、JPEG 原方向中央 4:5 裁切與 VGA 預覽／拍照固定模式已由實機確認：最終方向正確，預覽與拍照顏色一致。10 次冷開機與 30 次連拍全部成功，未回報 boot failure、花屏、壞圖、PSRAM 持續下降或重啟；下一步進入 Gate L0。

2026-08-24 為提升網站完成圖解析度，曾測試 VGA 預覽、UXGA 1600 × 1200 正式拍照。兩張過渡幀版本成功上傳 123,060-byte JPEG，但 R2 原始檔嚴重欠曝；提高至六張後仍然很暗，因此否決快門時切換解析度。現行候選版改為預覽與拍照皆固定 XGA 1024 × 768，像素數是 VGA 的 2.56 倍且不會在快門時重啟曝光收斂。F-13～F-15 尚待實機測試，因此 Gate H1 的既有通過證據仍以 VGA 固定模式為準。

固定 XGA 已恢復正常內容，但曝光補償 +1、gain ceiling 8×、對比 +2、飽和度 +2 的網站原圖仍偏暗，TFT 與原圖可見紅綠藍顆粒及些微白霧。候選版改為曝光補償 +2、gain ceiling 4×、對比 +1、飽和度 +1，以較長曝光取代高增益；TFT 的 XGA 解碼中間尺寸維持 256 × 192 後再縮圖。F-16～F-17 待實機測試，並須留意手持拍攝的動態模糊。

網站未後製原始 JPEG 進一步確認仍偏暗且對比、飽和度偏高，雖然 TFT 主觀上較好看。輸出校正改以網站原圖為準：亮度 +1、對比 0、飽和度 0，曝光 +2 與 gain ceiling 4× 維持不變；F-19 待實機測試。

任務：

- 相機取景顯示至 ST7735。
- 加入快門 debounce。
- 將 JPEG 複製到自有 PSRAM buffer，再歸還相機 framebuffer。
- 用 mutex 保護捕捉、顯示與裝置上傳讀取。
- 實作 `LIVE_VIEW → CAPTURING → COPYING → REVIEW` 狀態機。
- 成功時只顯示剛拍照片；錯誤時顯示錯誤狀態，不加入隨機文字。

完成條件：冷開機 10 次、連拍 30 次皆無 boot 失敗、花屏、壞圖、use-after-free 或重啟。

## Phase 5：Gate L0 Wi-Fi station、裝置上傳與 NFC

任務：

- 從忽略 Git 的設定／NVS 讀取 2.4 GHz SSID、密碼、device ID 與 credential。
- 實作 Wi-Fi station 自動重連、timeout、指數退避與離線非致命狀態。
- 接上 `device initiate → PUT original → complete`，保護 PSRAM buffer 生命週期。
- complete 成功後在 ST7735 顯示大字領取碼與期限；失敗時只顯示等待網路／重試。
- 使用 NFC Tools 把 `https://tiger-camera.fengyenchia.com/create` 寫入 NTAG213。

完成條件：手機熱點中斷與恢復後能上傳同一張照片且不重複；只有 Server 確認成功才顯示可用領取碼。

## Phase 6：Gate W0 Canvas 與離線待傳

任務：

- 保留原始 Blob，讓使用者獨立開關拍立得框、拍攝時間、文字與復古濾鏡，並產生獨立後製 Blob；拍攝時間自動取自照片 metadata、不提供日期選擇器，且允許全部不選。
- 文字支援自訂、預設與無文字，metadata 保存實際畫出的文字及所有後製選項。
- 處理直向、橫向、低光、大圖記憶體與 JPEG 輸出。
- 在 hosted site 建立 claim token session、processed 待傳佇列與 `pending／uploading／saved／failed` UI。
- 提供完成圖下載與「是否公開」選項；不提供原圖下載，未選公開時不得呼叫 process upload／publish API。

完成條件：landscape、portrait、low-light fixtures 輸出正確；清楚區分「下載完成」「待上傳」與「已永久保存」。

## Phase 7：Gate I0 相機與雲端整合

任務：

- 掃 NFC 進 hosted `/create`，輸入 ST7735 顯示的領取碼。
- Server 以 UNIQUE 6 位明碼原子地將 `ready → claimed`，清除配對碼並寫入 draft-scoped opaque UUID token。
- hosted site 以 claim token 暫時讀取私人原圖，執行 Canvas 並提供完成圖下載；不公開時流程在此結束，草稿由期限清理。
- 領取者勾選公開後，接上 `process initiate → PUT processed → publish`。
- 實作失敗重試、重複請求 idempotency 與明確錯誤訊息。
- 驗證 ESP32、claim holder 與 Admin 三種 token scope 完全隔離。

完成條件：至少一組 iPhone 與一組 Android 能完成「掃 NFC→輸入領取碼→後製→下載／選擇公開」；錯碼、過期、重複領取與斷網不會誤報成功。

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
| C0 | 裝置、領取者、公開訪客與管理員四種權限是否隔離？ | 停止硬體整合，先修 claim、auth、storage 與狀態一致性 |
| H0 | 是否收到 N16R8＋OV2640，且 USB-C 可燒錄？ | 換貨或修正板型設定，不沿用 AI-Thinker pinout |
| H1 | 相機＋ST7735＋快門＋PSRAM 可共存？ | 降 TFT clock、調整 reset／CS／GPIO 或降低 JPEG 規格 |
| L0 | 手機熱點重連、裝置上傳與螢幕領取碼是否可靠？ | 加強重試／狀態；若要保留多張離線照片則重新評估 microSD |
| W0 | Canvas 能在頁面期間安全持有原始 Blob？ | 停止雲端整合，修正 Blob 生命週期與狀態 UI |
| I0 | 配對碼交換、UUID token 與可選發布是否可恢復？ | 修正期限、UNIQUE collision、原子領取、idempotency 與 draft 綁定 |
| P0 | 電池供電完整且穩定？ | 補 5 V 升壓／保護或維持 USB 供電 |
| E0 | 殼內 Wi-Fi、散熱與維修性合格？ | 移天線、電池與開孔位置 |

## 目前工作清單

1. 完成 `web/frontend/`、`web/backend/` pnpm workspace 與 Backend health endpoint。
2. 建立兩個 Vercel projects，部署並設定 Frontend 網域、`api.tiger-camera.fengyenchia.com` 與 CORS。
3. 完成 Gate C0 的登入、測試 JPEG、相簿與刪除生命週期。
4. Gate C0 通過後才下單硬體核心驗證包。
5. 到貨後依 Phase 3 至 Phase 7 逐 Gate 前進。
6. 電池、microSD 與外殼維持延後。
