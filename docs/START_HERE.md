# START HERE

## 已完成的基線

1. **Gate H1 已通過**：OV2640、128×128 ST7735、GPIO1 快門與 PSRAM 最新 JPEG buffer 可共存。
2. **Gate L0 功能驗收已通過**：實機拍照、Wi-Fi 上傳、R2 私人草稿、6 位領取碼、網站領取與 Canvas 後製已跑通。
3. **Gate P0 已通過**：803040 電池、TP4056 充電保護、KCD1-11 電源開關、MT3608 5V 升壓及 P0.1 電壓／估算百分比顯示已完成實機驗收。
4. Web 已拆成 `web/frontend/` 與 `web/backend/`，正式網域為：
   - Frontend：`https://tiger-camera.fengyenchia.com`
   - Backend：`https://api.tiger-camera.fengyenchia.com`
   - API 文件：`https://api.tiger-camera.fengyenchia.com/api/docs`

## 現在的實作順序

1. **E0（目前階段）**：量測 PCB、螢幕、鏡頭、電池、模組與開關後，建立第一版基本矩形外殼。
2. **R0**：完成壓力、斷線、固定 token 輪替、清理排程與跨手機測試。

W0、I0 與 P0 均已通過；W0／I0 的手機與 NFC 流程詳見 [`w0-i0-guide.md`](w0-i0-guide.md)。

## 每次工作前

- 查 [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) 的目前 Gate 與未完成項目。
- 改韌體前讀 [`../firmware/tiger-camera-v1/README.md`](../firmware/tiger-camera-v1/README.md)。
- 改 Web 前讀 [`../web/docs/README.md`](../web/docs/README.md) 與 [`../web/docs/backend-setup.md`](../web/docs/backend-setup.md)。
- 改電源或接線前讀 [`wiring-map.md`](wiring-map.md)、[`hardware.md`](hardware.md) 與 [`test-plan.md`](test-plan.md)。
- 採購只更新 [`../bom/tiger-camera-v1.csv`](../bom/tiger-camera-v1.csv)。

## 不可跳過的原則

- 不把相機 framebuffer 指標留到 `esp_camera_fb_return()` 之後；先複製到自有 PSRAM。
- 新照片只有在拍攝成功後才取代上一張。
- 私人草稿先領取、再後製；未明確公開前不得出現在相簿。
- Wi-Fi 只提供網路，不是 API 身分驗證；單一相機以 Backend 與韌體共用的固定高熵 `DEVICE_UPLOAD_TOKEN` 驗證，Frontend 不得接觸此值。
- 鋰電池不得直接接 `5V` 或 `3V3`；先經過有保護的充電升壓模組。
- 初次電池測試不要同時接主板 USB-C 與外部 5V 輸出，避免回灌。
- 外殼尺寸以實物量測為準，不以賣場圖片估算。
