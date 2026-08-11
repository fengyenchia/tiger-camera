# Tiger Camera

一台以低成本零件組成、採用基本矩形相機外殼的小型數位相機。專案名稱暫時保留 Tiger Camera，但 V1 不再製作老虎造型外殼。

短按快門後，裝置會拍攝 JPEG、把最新一張暫存在 PSRAM，並在螢幕顯示照片與一則隨機文字；手機取得最新照片後，以 Canvas 套用復古效果，並可把原圖與後製圖永久保存到 `https://tiger-camera.fengyenchia.com` 的私人相簿。

> 目前狀態：規劃完成，尚未採購與實作。
> 規格基準日：2026-08-11。

## V1 範圍

- AroundTW／GOOUUU ESP32-S3-CAM、ESP32-S3-WROOM-1-N16R8 與 OV2640
- 1.44 吋 128 × 128 或 1.8 吋 128 × 160 ST7735 SPI 螢幕
- 實體快門，短按拍照
- 拍後回看時隨機顯示玩具感文字
- 最新 JPEG 暫存在 PSRAM；關機後消失
- 拍後回看與低電量／充電提示
- 相機建立 2.4 GHz Wi‑Fi 熱點
- Captive Portal、mDNS 名稱與備援 IP
- 手機網頁使用 Canvas 做復古後製，加入拍攝日期與拍立得邊框
- 被動 NFC 貼紙開啟最新照片固定網址
- 最新原圖與完成 JPEG 下載；無網路時仍可保存到手機
- 私人雲端相簿，分開保存原圖與後製圖
- 管理員登入與單次操作直接永久刪除
- 簡單矩形 3D 列印相機外殼

GIF 不列入 V1，保留在待做清單。

## 開工前最重要的驗證

第一個實作 Gate 是先用測試 JPEG 完成雲端「上傳→相簿→單次永久刪除」。第一個硬體 Gate 才是以實物證明「相機＋ST7735＋快門＋最新 JPEG PSRAM buffer」能穩定工作。microSD 暫不列入 V1，並保留 GPIO38～40 給未來裝置端離線備援。

## 文件入口

| 文件 | 內容 |
|---|---|
| [從這裡開始](docs/START_HERE.md) | 唯一開工順序、每個 Gate 與完成條件 |
| [完整產品規劃](docs/product-plan.md) | 目標、體驗、範圍、驗收標準 |
| [硬體與腳位](docs/hardware.md) | 模組、電源、暫定腳位、外殼限制 |
| [軟體與資料設計](docs/software.md) | 韌體、網站、API、檔案格式、網址 |
| [開發時程](docs/development-roadmap.md) | 階段、任務、決策關卡、待做清單 |
| [測試計畫](docs/test-plan.md) | 功能、壓力、手機相容性與驗收 |
| [購物清單](docs/bom.md) | 台幣預算、採購順序、替代品 |
| [CSV BOM](bom/tiger-camera-v1.csv) | 可匯入試算表的購物清單 |
| [Codex 專案規則](AGENTS.md) | 交給 Codex 後的範圍、順序與驗證規則 |
| [目前進度](PROJECT_STATUS.md) | 已決定事項、未驗證假設與下一階段 |

## 預算結論

- 最小核心驗證包：約 **NT$650～900**
- 含電池、充電／升壓與簡單外殼：約 **NT$1,450～2,100**
- 若焊接工具、麵包板等都沒有：再預留約 **NT$500～1,200**

不要一次買齊。先以測試 JPEG 完成雲端相簿 Gate，再買 ESP32-S3-CAM＋OV2640、螢幕與按鍵；板上已有 OTG 與 TTL 兩個 USB-C，不再另買 ESP32-CAM-MB。通過 GPIO 與顯示整合測試後，再買電池、充電／升壓板與外殼材料。microSD 先不買。硬體預算不含網站、資料庫、物件儲存、網域或流量費用。

## 建議目錄

```text
tiger-camera/
├── firmware/       # ESP32 韌體；data/ 放區域取圖頁面
├── web/            # tiger-camera.fengyenchia.com Next.js 網站與 API
├── enclosure/      # 基本相機外殼與尺寸（之後實作）
├── assets/         # 邊框、圖示、字型（之後加入）
├── bom/            # 採購表
└── docs/           # 規格、時程與測試
```

## 授權

目前尚未選擇開源授權。若儲存庫日後公開，應在上傳字型、圖案與 3D 模型前逐一確認授權，並再決定程式碼與設計檔的 LICENSE。
