# Firmware

正式且唯一維護的韌體專案是 [`tiger-camera-v1/`](tiger-camera-v1/)。早期 CameraWebServer、Wi-Fi 與 ST7735 單功能範例已完成驗證用途並從 repository 刪除。

## 已確認

- AroundTW／GOOUUU ESP32-S3-CAM N16R8＋OV2640
- ST7735 `128x128`
- GPIO1 快門
- 固定 XGA 預覽／拍照、拍後回看
- PSRAM 保存最新 JPEG
- Wi-Fi station、NTP、Device API、R2 PUT、complete 與領取碼
- Gate H1 與 Gate L0 功能流程通過；128×128 顯示的 RGB 色序與方形即時預覽已實機驗證

燒錄、secret、Serial log 與實機驗收請讀 [`tiger-camera-v1/README.md`](tiger-camera-v1/README.md)。
