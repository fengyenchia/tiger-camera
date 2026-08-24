# W0／I0 實作與驗收指南

更新日期：2026-08-24

## 目標

- **W0**：確認一般訪客、照片領取者與管理員在真實手機瀏覽器中的完整流程與權限。
- **I0**：確認被動 NFC 能穩定開啟固定 `/create` 網址，領取碼仍由相機螢幕提供。

W0／I0 通過後才進入 P0 鋰電池與 5V 升壓模組。

## 0. 部署前

1. 將目前 `web/frontend/` 與 `web/backend/` 部署到各自 Vercel project。
2. Backend 確認 `FRONTEND_ORIGIN=https://tiger-camera.fengyenchia.com`、`API_PUBLIC_URL=https://api.tiger-camera.fengyenchia.com`。
3. Frontend 確認 `NEXT_PUBLIC_API_BASE_URL=https://api.tiger-camera.fengyenchia.com/api`。
4. 打開 `/api/health`、`/api/docs`、首頁與公開相簿。
5. 不把 `.env.local`、Admin JWT、Device credential、Neon 或 R2 secrets 加入 Git。

## 1. W0 桌面 Smoke Test

1. 拍一張新照片並等相機顯示 6 位碼。
2. 在 `/create` 領取，確認原圖只有 claim holder 能看。
3. 測試後製全部關閉，以及框／日期／文字／濾鏡／亮度的組合。
4. 下載私人完成圖，確認不會自動公開。
5. 重新拍一張並公開，確認自動跳到 `/gallery`。
6. 點照片開啟 overlay；Dialog 只負責放大與關閉，不放重複下載按鈕。
7. 點卡片外側下載按鈕，必須直接下載 JPEG，不開啟 R2 圖片頁。
8. 管理員永久刪除測試照片，公開列表與圖片 URL 都不能再讀取。

## 2. W0 手機矩陣

用至少一台 iPhone Safari 與一台 Android Chrome，各跑一次：

| 項目 | iPhone Safari | Android Chrome |
| --- | --- | --- |
| 開啟 `/create` | [ ] | [ ] |
| 6 位碼領取 | [ ] | [ ] |
| 原圖與 Canvas 預覽 | [ ] | [ ] |
| 亮度調整與其他後製 | [ ] | [ ] |
| 下載私人完成圖 | [ ] | [ ] |
| 公開並自動跳相簿 | [ ] | [ ] |
| Overlay 放大／關閉 | [ ] | [ ] |
| 卡片外側直接下載 | [ ] | [ ] |
| 直式與橫式照片 | [ ] | [ ] |

每次記錄手機型號、OS、瀏覽器版本、照片方向、下載檔名、檔案大小與失敗訊息。iOS 可能把下載放在「檔案」App 的 Downloads；只要沒有開成圖片分頁且能找到 JPEG 即通過。

## 3. W0 API 與權限

- [ ] `/api/photos` 只回 `active` 照片。
- [ ] `/api/photos/:id/image` 可公開檢視。
- [ ] `/api/photos/:id/image?download=1` 回 `200`、`Content-Type: image/jpeg`、`Content-Disposition: attachment`。
- [ ] 未領取／未公開草稿不出現在公開列表。
- [ ] Claim token 不能操作別張 draft。
- [ ] 無 Admin Bearer 無法刪除；有效 Admin JWT 可一次永久刪除。
- [ ] Browser bundle、Network response 與 log 沒有 R2／Neon／JWT signing secrets。

## 4. I0 寫入 NFC

1. 用 NFC Tools 選「寫入 → URL/URI」。
2. 寫入：`https://tiger-camera.fengyenchia.com/create`
3. 先不要設定唯讀或永久鎖定。
4. NFC 不寫領取碼、draft ID、claim token 或照片 URL。
5. 暫時把貼紙放在預定機身位置，避免緊貼 ESP32 天線、電池或大片金屬。

## 5. I0 實機驗收

| 項目 | iPhone | Android |
| --- | --- | --- |
| 解鎖狀態感應 | [ ] | [ ] |
| 可接受距離／位置 | [ ] | [ ] |
| 正確開啟 `/create` | [ ] | [ ] |
| 網路較慢時仍能重試 | [ ] | [ ] |
| 掃描後輸入相機領取碼 | [ ] | [ ] |

至少各掃描 10 次並記錄成功次數。若 NFC 失敗，使用者仍能手動輸入印在機身上的網址；NFC 不是照片或密碼的安全邊界。

## 6. Gate 通過條件

- W0：兩種手機完成領取、後製、下載、公開、相簿與權限流程，沒有阻塞性錯誤。
- I0：兩種手機都能穩定開啟固定網址，領取碼流程不依賴 NFC 動態寫入。
- 失敗案例、裝置與瀏覽器版本已記入測試紀錄。
- 通過後更新 `PROJECT_STATUS.md`，再開始 P0；未通過前不鎖定 NFC 或外殼位置。
