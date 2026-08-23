# [Tiger Camera](https://tiger-camera.fengyenchia.com/)

一台採用基本矩形相機外殼的小型數位相機。專案名稱暫時保留 Tiger Camera，但 V1 不再製作老虎造型外殼。

短按快門後，裝置會拍攝 JPEG、把最新一張暫存在 PSRAM，並透過已設定的手機熱點或 Wi-Fi 上傳成私人草稿。上傳成功後螢幕顯示領取碼；使用者掃描機身 NFC 開啟 `https://tiger-camera.fengyenchia.com/create`，輸入領取碼後在自己的手機後製、下載完成圖，並自行決定是否公開到網站相簿。

只有相機需要連上預先設定的熱點；領取者不必加入該熱點，只要用自己的行動網路或一般 Wi-Fi 開啟網站即可。

> 目前狀態：Gate H1 已通過；Gate L0 Wi-Fi station、NTP、背景
> `initiate → R2 PUT → complete`、重試與領取碼顯示已完成 production build，
> 實機已確認 Wi-Fi、NTP 與 production Device initiate；R2 首測因誤用
> Cloudflare leaf certificate 而失敗，現已改用獨立 GTS Root R4，下一步是
> 重刷後驗證 R2 PUT、complete、領取碼與斷線恢復。完整雲端 E2E 仍待完成。
> 規格基準日：2026-08-23。

## V1 範圍

- AroundTW／GOOUUU ESP32-S3-CAM、ESP32-S3-WROOM-1-N16R8 與 OV2640
- 已通過 Gate H1 的 128 × 160 ST7735 SPI 螢幕（實物對角尺寸與 PCB 尺寸需在外殼 Gate 前補記）
- 實體快門，短按拍照
- 拍後直接回看剛拍的照片，不顯示隨機文字
- 最新 JPEG 暫存在 PSRAM；關機後消失
- 拍後回看與低電量／充電提示
- 相機連接預先設定的 2.4 GHz 手機熱點或可信任 Wi-Fi，並自動重連與重試上傳
- 照片先上傳為私人草稿；螢幕顯示 6 位、24 小時有效的單張照片配對碼
- 手機網頁可獨立開關拍立得框、拍攝時間、文字與復古濾鏡；拍攝時間由照片資料自動帶入，不提供手動日期選擇，也可全部不選
- 被動 NFC 貼紙固定開啟 `https://tiger-camera.fengyenchia.com/create`
- 領取碼持有者可暫時讀取該張私人原圖，在自己的手機後製並下載完成圖
- 領取碼只用來方便找到照片，不視為安全密碼；猜到別人的碼是 V1 接受的取捨
- 私人草稿預設不公開；領取者明確選擇後才加入公開相簿
- 後製照片可只下載不公開；勾選公開後才加入所有人可看的雲端相簿
- 雲端原圖只供領取與後製暫用；公開成功或草稿逾期後刪除，只永久保存完成圖
- ESP32 只持有可撤銷的 device-scoped 上傳憑證；不保存管理員、R2 或資料庫密鑰
- 管理員登入後由前端保存短效 JWT，Axios 主動附加 `Authorization: Bearer`；只有管理員可單次操作永久刪除
- 簡單矩形 3D 列印相機外殼

GIF 不列入 V1，保留在待做清單。

## 開工前最重要的驗證

第一個實作 Gate 是先用測試 JPEG 完成雲端「私人上傳→領取碼→手機後製→可選公開→單次永久刪除」。第一個硬體 Gate 才是以實物證明「相機＋ST7735＋快門＋最新 JPEG PSRAM buffer」能穩定工作。microSD 暫不列入 V1，並保留 GPIO38～40 給未來裝置端離線備援。

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
├── firmware/       # ESP32 韌體；Wi-Fi station、裝置驗證與私人草稿上傳
├── web/
│   ├── frontend/   # tiger-camera.fengyenchia.com 頁面、Canvas 與 Axios
│   └── backend/    # 獨立部署的 API、R2、Neon 與驗證
├── enclosure/      # 基本相機外殼與尺寸（之後實作）
├── assets/         # 邊框、圖示、字型（之後加入）
├── bom/            # 採購表
└── docs/           # 規格、時程與測試
```

## 授權

目前尚未選擇開源授權。若儲存庫日後公開，應在上傳字型、圖案與 3D 模型前逐一確認授權，並再決定程式碼與設計檔的 LICENSE。
