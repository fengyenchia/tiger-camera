# Tiger Camera V1 Firmware

AroundTW／GOOUUU ESP32-S3-CAM（ESP32-S3-WROOM-1-N16R8＋OV2640）的正式 PlatformIO 韌體。Gate H1 與 Gate L0 功能流程已通過；ST7735 已更正為 128×128，RGB 色序與方形即時預覽已重新實機驗證。

## 功能

- ST7735 `128x128` 方形即時預覽。
- GPIO1 短按拍攝固定 XGA `1024x768` JPEG。
- framebuffer 先複製到 owned PSRAM，再歸還 camera driver。
- 下一張成功照片取代裝置中的上一張；不使用 microSD。
- 拍後顯示照片，不顯示隨機文字或播放聲音。
- Core 0 背景連線 2.4 GHz Wi-Fi、同步 NTP、建立私人草稿、R2 PUT、complete、重試。
- 上傳完成後顯示 6 位領取碼與期限。
- 網路失敗不阻塞 Core 1 的預覽與快門。

## 硬體基線

- Flash：16 MB
- PSRAM：8 MB
- Camera：OV2640，PID `0x26`
- Display：ST7735 `128x128`、`INITR_144GREENTAB`、BGR、`invertDisplay(false)`
- Shutter：GPIO1，閒置 HIGH，按下接 GND
- Camera tuning：JPEG quality 8、brightness +1、contrast -1、saturation 0、AE level +2、gain ceiling 8x

先前測過快門時由 VGA 切換 UXGA，但會嚴重欠曝，已淘汰。正式路徑固定使用 XGA，避免重新啟動曝光與白平衡收斂。

## 建置

在 repository root：

```powershell
pio run -d firmware/tiger-camera-v1
pio run -d firmware/tiger-camera-v1 -t upload
pio device monitor -b 115200
```

若 `pio` 不在 PATH，可在已安裝 PlatformIO 的終端執行相同指令。

## Secrets

1. 複製 `include/secrets.example.h` 為 `include/secrets.h`。
2. 填入 2.4 GHz Wi-Fi、Backend URL、固定高熵 upload token 與 API TLS root CA。`deviceCredential` 這個既有 C++ 欄位的值必須與 Backend `DEVICE_UPLOAD_TOKEN` 完全相同；Frontend 不會建立或顯示它。
3. `include/secrets.h` 已忽略，不得 commit。

ESP32 不保存 Admin JWT、R2 access key、Neon connection string 或 JWT signing secret。R2 PUT 使用短效、指定 object path 的 presigned URL；API 與 R2 使用各自 CA，不使用 `setInsecure()`。

## 正常 Serial 流程

```text
[camera] ready, PID=0x26, tuning=applied
[shutter] GPIO1 idle=HIGH
[wifi] connected; IP=... RSSI=... dBm
[photo] captured 1024x768 ... bytes
[upload] queued generation=... request=... bytes=...
[upload] complete generation=... code=...... expires=...
[claim] code=...... expires=...
```

完整領取碼以最新一筆 `[upload] complete`／`[claim]` 與 TFT 顯示為準。

## 驗收狀態

- Gate H1：10 次冷啟動、30 次連拍與 PSRAM 已通過；128×128 `INITR_144GREENTAB` 的 RGB 色序與方形即時預覽已重新實機確認。
- Gate L0：實機 Wi-Fi、TLS、R2 upload、complete、領取碼與網站 claim 已通過功能驗收。
- Android Chrome 的 W0／I0 功能流程已通過，目前進入 P0；iPhone Safari 留到 R0。
- 發布前仍需補 30 次完整上傳、5 次斷線恢復及 `DEVICE_UPLOAD_TOKEN` 輪替的量化紀錄。

## 外接電池

P0 不修改目前 USB 韌體基線。硬體會以「帶保護 LiPo → 充電／保護／5V 升壓 → 開關 → 主板 5V/GND」供電。未加入 ADC／fuel gauge 前，韌體不顯示假電量百分比。接線與測試見 [`../../docs/hardware.md`](../../docs/hardware.md) 及 [`../../docs/test-plan.md`](../../docs/test-plan.md)。
