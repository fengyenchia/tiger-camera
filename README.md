# Tiger Camera

Tiger Camera 是以 AroundTW／GOOUUU ESP32-S3-CAM（ESP32-S3-WROOM-1-N16R8、OV2640）製作的簡易數位相機。相機透過 2.4 GHz Wi-Fi 上傳私人草稿，使用者掃描機身 NFC 後輸入螢幕上的 6 位領取碼，在手機瀏覽器完成後製、下載，並自行決定是否公開。

## 目前狀態

- Gate H1：相機、128×128 ST7735、快門與 PSRAM 共存已通過實機驗收。
- Gate L0：拍照、上傳、領取碼、瀏覽器領取與 Web 後製的功能流程已通過。
- Web：Frontend、Backend、Neon、Cloudflare R2 與正式網域均已接通。
- W0／I0 已以 Android Chrome 完成功能驗收。
- Gate P0：803040、TP4056、KCD1-11、MT3608 與 P0.1 電量顯示已於 2026-08-28 由使用者完成實機驗收；下一階段為 E0 外殼。

目前實機採固定 XGA `1024x768` 拍照與預覽；短按快門會拍攝 JPEG、顯示照片並上傳，螢幕不顯示隨機文字。下一張成功照片會取代裝置 PSRAM 中的上一張。

## 專案結構

- `firmware/tiger-camera-v1/`：正式 PlatformIO 韌體
- `web/frontend/`：Next.js 公開網站、領取與 Canvas 後製
- `web/backend/`：Next.js API、Neon 與 Cloudflare R2
- `web/docs/`：Web 架構、環境變數與部署步驟
- `docs/`：產品、硬體、軟體、路線圖與測試
- `bom/tiger-camera-v1.csv`：唯一採購清單
- `enclosure/`：量測完成後建立的外殼資料
- `assets/`：授權與資產規則；實際 Web 資產放在 `web/frontend/public/`

## 從哪裡開始

1. 先看 [`docs/START_HERE.md`](docs/START_HERE.md)。
2. 目前狀態與下一步看 [`PROJECT_STATUS.md`](PROJECT_STATUS.md)。
3. 韌體操作看 [`firmware/tiger-camera-v1/README.md`](firmware/tiger-camera-v1/README.md)。
4. Web 建置看 [`web/docs/backend-setup.md`](web/docs/backend-setup.md)。
5. W0／I0 驗收結果與 R0 尚待項目看 [`docs/w0-i0-guide.md`](docs/w0-i0-guide.md)。
6. 專案所有實際接口看 [`docs/wiring-map.md`](docs/wiring-map.md)；電池與升壓模組接線、驗收看 [`docs/hardware.md`](docs/hardware.md) 與 [`docs/test-plan.md`](docs/test-plan.md)。

## V1 原則

- 原始 JPEG 只作為私人暫存草稿；發布成功或逾期後刪除。
- 永久保存的是手機後製完成圖，公開與否由領取者決定。
- 公開相簿所有人可看，只有管理員能永久刪除。
- ESP32 只保存 Wi-Fi 與固定高熵 `DEVICE_UPLOAD_TOKEN`，不保存 R2、Neon 或管理員密鑰；連上 Wi-Fi 不等於通過 Backend 驗證。Token 只存在 Backend environment 與被 Git 忽略的韌體 `secrets.h`。
- Wi-Fi 失敗不能讓基本拍照功能失效。
- V1 不做 GIF、錄影、公開註冊、藍牙傳圖、AI 濾鏡或社群自動上傳。

<!-- ## Git 與秘密

API 網址、Frontend 網址與 R2 hostname 不是秘密，必須能被瀏覽器或裝置看見；真正不可公開的是密碼、token、JWT signing secret、Neon connection string、R2 access key 與私人金鑰。這些值只放在被 `.gitignore` 排除的 `.env.local` 或 `secrets.h`。Repository 只保留不含真值的 `.env.example` 與 `secrets.example.h`。 -->
