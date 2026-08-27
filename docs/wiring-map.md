# Tiger Camera V1 專案接線總表

本文件只記錄 Tiger Camera V1 **實際使用中的接口與接線**，不是 ESP32-S3 通用 pinout。日後拆線、重焊或製作外殼時，以本表與 [`board_pins.h`](../firmware/tiger-camera-v1/include/board_pins.h) 為準。

## ESP32-S3-CAM 對外接線

| 板上代號／專案功能 | 外部模組端 | ESP32-S3-CAM 端 | 狀態／注意事項 |
| --- | --- | --- | --- |
| 主電源正極 | MT3608 `OUT+` | `5V` | MT3608 必須先調到約 5.0V |
| 主電源負極 | MT3608 `OUT-` | `GND` | 與全部模組共地 |
| TFT `GND` | ST7735 `GND` | `GND` | 共地 |
| TFT `VCC` | ST7735 `VCC` | `3V3` | 不接 5V 邏輯 |
| TFT `SCL` | ST7735 `SCL` | GPIO47 | 板上雖標 SCL，實際作為 SPI Clock |
| TFT `SDA` | ST7735 `SDA` | GPIO21 | 板上雖標 SDA，實際作為 SPI MOSI |
| TFT `RES` | ST7735 `RES` | 主板 `RST` | 與主板 Reset 共用；韌體使用 `-1` |
| TFT `DC` | ST7735 `DC` | GPIO14 | 資料／命令選擇；已實機確認 |
| TFT `CS` | ST7735 `CS` | `GND` | 固定選取；韌體使用 `-1` |
| TFT `BLK` | ST7735 `BLK` | `3V3` | 背光；目前不做 PWM 調光 |
| 快門輸入 | 按鈕訊號端 | GPIO1 | `INPUT_PULLUP`，閒置 HIGH |
| 快門接地 | 按鈕另一端 | `GND` | 按下時 GPIO1 與 GND 導通 |
| 電池電壓量測 | 兩顆 100kΩ 電阻中點 | GPIO3 | 已校正；不可直接接電池或 5V |

## ST7735 接線速查

```text
ST7735 GND       → ESP32 GND
ST7735 VCC       → ESP32 3V3
ST7735 SCL       → ESP32 GPIO47
ST7735 SDA       → ESP32 GPIO21
ST7735 RES       → ESP32 RST
ST7735 DC        → ESP32 GPIO14
ST7735 CS        → GND
ST7735 BLK       → ESP32 3V3（模組有此腳時）
```

以上名稱依本專案使用的 TFT 板上絲印記錄；其中 `SCL` 是 SPI Clock，`SDA` 是 SPI MOSI，不是 I2C 接線。

## 快門按鈕接線

```text
ESP32 GPIO1 ── 快門按鈕 ── GND
```

兩腳面板固定式按鈕的板上／商品代號為 `060009`，接點額定標示為 `125V 3A`。使用者已接上 GPIO1 與 GND 實測，按一下可成功拍照且放開會自動復位，因此確認可作為快門。`125V 3A` 是開關接點可承受的額定標示，不是相機供電電壓；本專案只把它當作低電壓 GPIO 訊號開關。

- `060009` 兩腳面板式按鈕：任一端接 GPIO1，另一端接 GND，沒有正負極；已完成實機拍照測試。
- 四腳輕觸按鈕：同一側的兩腳通常互通，需取按下前互不導通的兩側各一腳。
- 面板式按鈕較方便鎖在外殼上，按帽較大、行程與手感通常較明顯，但需要量螺牙直徑、面板開孔、後方深度及接線端子空間。
- 焊接前以 DT-830D 通斷檔確認；不要只依商品照片判斷，也不要把 GPIO1 接到 3V3 或 5V。

## 電池、充電、開關與升壓接線

```text
803040 紅線 ───────────────→ TP4056 B+
803040 黑線 ───────────────→ TP4056 B-

TP4056 OUT+ ── KCD1-11 ──┬─→ MT3608 IN+
                          │
                          └─→ 電阻1 100kΩ
                                  │
                                  ├─→ ESP32 GPIO3
                                  │
                               電阻2 100kΩ
                                  │
TP4056 OUT- ──────────────────────┴─→ MT3608 IN-／ESP32 GND

MT3608 OUT+ ────────────────────────→ ESP32 5V
MT3608 OUT- ────────────────────────→ ESP32 GND
```

- 電阻1靠近正極的一端可直接焊在 MT3608 `IN+`。
- 電阻1另一端、電阻2一端與 GPIO3 三者接在同一個中點。
- 電阻2另一端可接任何已確認的系統 GND，包括快門按鈕的 GND 線；不可接 GPIO1 訊號端。
- 0.1µF 陶瓷電容為選配，目前不安裝也能使用。
- 充電時關閉 KCD1-11；使用時拔除 TP4056 USB-C 再開機。
- 不同時使用 ESP32 USB-C 與 MT3608 5V 供電，避免回灌。

## OV2640 板載相機接口

相機已透過板載 FPC 連接，不需要另外拉線；以下是韌體實際使用值，供日後除錯：

| OV2640 訊號 | ESP32 GPIO |
| --- | ---: |
| SIOD／SDA | 4 |
| SIOC／SCL | 5 |
| VSYNC | 6 |
| HREF | 7 |
| XCLK | 15 |
| PCLK | 13 |
| D0／Y2 | 11 |
| D1／Y3 | 9 |
| D2／Y4 | 8 |
| D3／Y5 | 10 |
| D4／Y6 | 12 |
| D5／Y7 | 18 |
| D6／Y8 | 17 |
| D7／Y9 | 16 |
| RESET | NC／`-1` |
| PWDN | NC／`-1` |

相機的 GPIO4／GPIO5 是 SCCB 控制線，不是外接 TFT 的 SDA／SCL。TFT 實際使用 GPIO21／GPIO47。

## 電池顯示校正

- GPIO3：ADC1_CH2。
- 分壓：100kΩ／100kΩ，比例 2:1。
- 2026-08-28：DT-830D 為 4.00V、原始 TFT 為 3.80V。
- 韌體校正係數：`1.0526`。
- 校正後使用者已確認 TFT 與 DT-830D 讀值一致。
- TFT 即時預覽與拍後回看右下角顯示 `x.xxV yy%`，無黑底；百分比是 LiPo 電壓推估值。

## 韌體唯一 GPIO 定義

正式 GPIO 常數位於：

```text
firmware/tiger-camera-v1/include/board_pins.h
```

任何接線變更都要同步更新本文件、`board_pins.h`、[`hardware.md`](hardware.md) 與 [`test-plan.md`](test-plan.md)，並重新建置與做實機回歸測試。
