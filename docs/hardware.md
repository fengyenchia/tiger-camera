# 硬體、腳位與基本外殼規劃

## 1. 模組分工

| 模組 | 職責 |
|---|---|
| AroundTW／GOOUUU ESP32-S3-CAM | ESP32-S3-WROOM-1-N16R8、16 MB Flash、8 MB Octal PSRAM、2.4 GHz Wi‑Fi、雙 USB-C 與 microSD 卡槽 |
| OV2640 | 2 MP JPEG 相機，最高 1600 × 1200 |
| ST7735 SPI 螢幕 | 即時預覽、拍後照片、文字與狀態 |
| 快門按鍵 | 短按拍照 |
| NTAG213／NTAG215 貼紙 | 被動保存正式網站 `/create` 固定網址；相機端不需要 NFC 電子模組 |
| LiPo 充電／保護／5 V 升壓方案 | 選配可攜供電；必須逐項確認功能 |

## 2. ESP32-S3-CAM 商品與 pinout 判讀

使用者提供的商品頁與 pinout 圖已確認：

- 商品選項為 ESP32-S3-CAM＋OV2640，商品頁價格區間 NT$420～480。
- 模組標示 ESP32-S3-WROOM-1-N16R8，即 16 MB Flash 與 8 MB Octal PSRAM。
- 板上有 OTG 與 TTL 兩個 USB-C、RST 與 BOOT 按鍵；不再需要 ESP32-CAM-MB。
- 相機占用 GPIO4～13、15～18；PSRAM 標示 GPIO35～37；SD 標示 GPIO38～40；USB D−／D+ 為 GPIO20／19。
- GPIO0 是 BOOT；GPIO3、45、46 涉及 JTAG／log／strapping，用於外設前需額外確認。
- GPIO48 連板載 WS2812；GPIO43／44 是 UART0。

2026-08-16 實機確認：

- 實際 PCB、ESP32-S3-WROOM-1-N16R8 與 OV2640 標示已記錄。
- 韌體讀得 Flash 16,777,216 bytes（16 MB）。
- PSRAM 成功啟用，總容量 8,388,608 bytes（8 MB），當次啟動可用
  8,384,788 bytes。
- Camera 與 ST7735 範例已分別跑通；ESP32 已能連接測試用 2.4 GHz
  手機熱點／Wi-Fi。
- 合併韌體 Serial 已確認 OV2640 PID `0x26`、sensor tuning applied、GPIO1
  idle HIGH 與 press latched；單次成功拍得 20,174-byte JPEG，當時剩餘
  PSRAM 為 8,242,243 bytes。
- ST7735 使用 `INITR_BLACKTAB` 時，原生紅綠藍白色條實際顯示為藍綠紅白，
  證明該面板需要 BGR 色序；韌體已改用同尺寸／offset 的 `INITR_REDTAB`，
  並關閉會造成負片效果的 inversion。實機已確認最終方向正確，VGA 預覽
  與拍照回看顏色一致。
- Camera＋ST7735＋GPIO1 快門＋PSRAM 已完成 10 次冷開機與 30 次連拍，
  全部成功；Gate H1 通過，GPIO1 可鎖定為原型快門腳位。
- 2026-08-24 為改善網站成品解析度，曾測試 VGA 預覽、UXGA 1600 × 1200
  拍照。兩張過渡幀版本雖成功拍攝、上傳 123,060-byte JPEG 並取得領取碼，
  但 R2 原始 JPEG 嚴重欠曝；提高至六張過渡幀後仍然很暗，因此棄用快門時
  切換解析度。現行候選版將預覽與拍照皆固定為 XGA 1024 × 768，像素數是
  VGA 的 2.56 倍且不會重啟曝光收斂。仍需重新驗證原圖曝光、預覽速度、
  PSRAM 與連拍穩定性，尚未取代上述 VGA 實機基準。
- 固定 XGA 可正常成像，但曝光補償 +1 時網站原圖仍偏暗，TFT 與原圖可見
  紅綠藍顆粒與些微白霧。候選調校改為曝光補償 +2、gain ceiling 4×、
  對比 +1、飽和度 +1，以較長曝光取代高增益；TFT 仍先解碼 256 × 192，
  再縮至 128 × 160。需同時檢查噪點、亮度與移動物體的模糊程度。
- 上述低增益候選版實測後，網站原圖仍偏暗，XGA 與 TFT 預覽仍偏糊；目前
  只證明檔案尺寸與像素增加，未證明光學細節增加。下一步先以明亮持續光、
  固定相機及 0.5–1 m 靜止物體隔離低光長曝光、近距離失焦與鏡頭問題，
  暫不再用曝光／增益參數互相補償。
- 網站未後製原始 JPEG 實測仍比 TFT 主觀感受更暗，且對比、飽和度較高；
  以最終網站檔案為校正基準，候選參數改為亮度 +1、對比 0、飽和度 0，
  曝光 +2 與 gain ceiling 4× 維持不變。TFT 顯色差異不另外回寫至 JPEG。

賣家資料仍未顯示 LiPo 充電電路，因此雙 USB-C 只能先視為通訊、燒錄與 USB 供電，不能視為電池充電接口。

### 2.1 賣家標示的外接 5 V 鋰電模組

| 項目 | 賣家標示 |
|---|---|
| 充電輸入 | DC 4.5–5.5 V，建議 5 V |
| 充電電流 | 0–2.1 A |
| 充滿電壓 | 4.2 V ±1% |
| 放電輸出 | 5–5.15 V，最高標示 2.4 A |
| 靜態放電電流 | 80 µA |
| 保護 | OCP、OVP、SCP、OTP，並宣稱帶鋰電池保護 |

這表示它在功能描述上同時包含單節鋰電充電、5 V 升壓與保護，但仍不能直接鎖定：

1. 必須向賣家確認是否支援邊充邊放／負載共享。
2. `0–2.1 A` 不是 800 mAh 電池的安全保證；必須確認實際充電電流如何設定，並以電池製造商允許值為準。
3. 2.4 A 是商品標示的上限，不等於長時間連續輸出能力；需用相機＋Wi‑Fi＋螢幕實測壓降與溫升。
4. 到貨後核對電池極性、接線腳位與保護板，不能只看接頭方向。

## 3. 螢幕選擇

Gate H1 實際韌體與畫面已鎖定為 ST7735、128 × 160、SPI 直式顯示；
`INITR_REDTAB`／BGR、inversion off 與目前 GPIO 接法均已通過 10 次冷開機
與 30 次連拍。購物清單原先以 1.44 吋 128 × 128 為候選，已不能再當作
實機規格。進入外殼 Gate 前仍需量測並補記面板對角尺寸、可視區與 PCB
長寬，不能從賣場共用標題推定是 1.44 或 1.8 吋。

## 4. GPIO 分區與暫定接法

依賣家 pinout，第一版避開相機 GPIO4～13、15～18、PSRAM GPIO35～37、SD GPIO38～40、USB GPIO19／20、BOOT GPIO0、UART0 GPIO43／44、WS2812 GPIO48，以及需額外確認的 GPIO3／45／46。下表接法已通過 Gate H1 原型實測；進入正式 PCB 前仍需保留 USB、boot 與維修空間。

| 功能 | 候選 GPIO | 備註 |
|---|---:|---|
| TFT SCK | 47 | pinout 未標示板載占用；以 GPIO matrix 配置 SPI clock |
| TFT MOSI | 21 | pinout 未標示板載占用；以 GPIO matrix 配置 SPI MOSI |
| TFT DC | 14 | pinout 未標示相機或板載占用 |
| TFT CS | 接 GND | V1 只有一個 SPI 裝置，可固定選取以省一腳 |
| TFT RST | 接主板 RST | 先確認螢幕允許共用 reset |
| TFT BLK | 3.3 V 或經電阻 | 先不做 PWM 調光以省 GPIO |
| 快門 | 1 | 10 次冷開機與 30 次連拍成功；鎖定為原型快門腳位 |

若候選腳位實測不穩，優先改用 GPIO2、41 或 42，但需先停用對應板載 LED／JTAG 功能並重新跑冷開機測試。GPIO45 雖在圖上標示 VSPI，仍屬 strapping 相關腳位，第一版不使用。

## 5. microSD 決策

microSD 不是「能拍照與手機看最新照片」的必要條件。成本版 V1 採以下方式：

1. `esp_camera_fb_get()` 取得 JPEG framebuffer。
2. 將 JPEG 複製到程式持有的 PSRAM buffer。
3. 完成複製後才 `esp_camera_fb_return()`。
4. 螢幕與雲端上傳都讀取這份受 mutex 保護的 buffer。
5. 下一張成功照片取代上一張；關機後照片消失。

代價是沒有**裝置端**永久保存、裝置端 JSON metadata、多照片相簿與重開機復原；下一次成功拍攝會直接取代 PSRAM 上一張。網路正常時裝置會把原圖上傳為短期私人草稿，領取者再決定是否發布完成圖；發布或草稿逾期後刪除雲端原圖。若需要斷網、關機後仍能復原多張照片，再購買 microSD 並新增第二個決策 Gate；不在成本版第一批採購。

## 6. 電源設計

ESP32-S3-WROOM 模組工作電壓為 3.0～3.6 V，但開發板提供 5 V 腳與 USB-C 供電。單節 LiPo 約 3.0～4.2 V，不能直接把電池接到 5 V 腳，也不能只經充電板就假定能穩定供電。

成本版分兩階段：

1. **Gate H0/H1：USB-C 供電。** 分別驗證 TTL 與 OTG 接口的燒錄、序列輸出及 5 V 供電，再完成相機、螢幕與 Wi‑Fi 驗證。
2. **通過後再買電池方案。** 需要單節 LiPo 充電、保護及能承受 Wi‑Fi／相機峰值的穩定 5 V 升壓。若商品底板缺任一項，就不能直接使用。

為節省 GPIO 與零件，成本版不做精確電量百分比；可先依充電板 LED 顯示充電狀態。正式電池續航與發熱必須實測。

## 7. 基本外殼

- 兩片式矩形殼：前殼放鏡頭、螢幕與快門，後殼提供 USB 與維修開口。
- 不做虎頭、耳朵、鼻子、嘴型遮罩、虎紋或角色裝飾件。
- 第一版先印平面定位板，再印只有必要孔位的功能殼。
- 電池版必須保留膨脹空間，螺絲不可指向電池。
- 天線區域避免電池與大面積金屬。
- 1.44 與 1.8 吋模組外形不同，買到實物並量測後才決定螢幕窗。

## 8. 硬體關卡

### Gate H0：商品與 USB 供電

- 確認買到 ESP32-S3-CAM N16R8＋OV2640 選項。
- TTL／OTG USB-C 至少一個可穩定燒錄，兩者角色與序列輸出已記錄。
- 韌體讀得 16 MB Flash、8 MB PSRAM，OV2640 初始化成功。

### Gate H1：成本版核心

- 相機連續取景。
- ST7735 穩定更新且冷開機 10 次皆成功。
- 快門不影響 boot strapping。
- 連拍 30 次，最新 JPEG buffer 可正確取代並由 HTTP 讀取。

### Gate H2：NFC、手機熱點與電池

- ESP32 可穩定連接目標 2.4 GHz 手機熱點，斷線後自動重連且不影響拍照。
- 感應 NFC 可開啟 `https://tiger-camera.fengyenchia.com/create`，使用者再輸入螢幕領取碼。
- 充電、保護、5 V 升壓與峰值電流皆實測合格。
- 確認充電電流適合實際電池；邊充邊用若未明確支援則禁止。

### Gate H3：基本外殼

- USB、快門、鏡頭、螢幕與天線不被遮擋。
- 可拆修、無電池擠壓，文字在小螢幕完整可讀。

## 9. 主要參考

- [ESP32-S3-WROOM-1 規格資料](https://documentation.espressif.com/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf)
- [Espressif esp32-camera driver](https://github.com/espressif/esp32-camera)
- [Waveshare 1.8 吋 ST7735S 參考規格](https://www.waveshare.com/wiki/1.8inch_LCD_Module)
