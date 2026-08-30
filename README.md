# Tiger Camera

一台把「按下快門」變成可收藏記憶的可愛 DIY 相機。

Tiger Camera 以 ESP32-S3-CAM 與 OV2640 為核心，拍照後透過 Wi-Fi 暫存照片。使用者掃描機身 NFC、輸入螢幕上的領取碼，就能直接在手機瀏覽器完成後製、下載，或將成品公開到網站相簿。

![Tiger Camera 外觀示意圖](assets/showcase/tiger-camera.png)

## 特色

- 短按快門即可拍攝 JPEG，並在小型 TFT 螢幕上回顧照片
- 透過 2.4 GHz Wi-Fi 上傳私人照片草稿
- NFC 開啟領取頁，再以六位領取碼取得自己的照片
- 手機瀏覽器直接後製，不需要安裝 App
- 可選擇：
  - 拍立得白邊框
  - 拍攝日期與時間
  - 自訂文字或可愛預設文字
  - 直式 3:4、橫式 4:3、方形 1:1
  - 多種可愛風格濾鏡
- 完成圖可下載，也可以選擇公開到相簿
- 公開相片支援放大檢視與下載
- 原始照片只作為私人暫存，永久保存的是後製完成圖

## 網站

- 公開網站：[tiger-camera.fengyenchia.com](https://tiger-camera.fengyenchia.com)
- 使用流程：開啟網站的 `/create` 頁面 → 輸入相機顯示的六位領取碼 → 後製 → 下載或公開
- 公開相簿：[tiger-camera.fengyenchia.com/gallery](https://tiger-camera.fengyenchia.com/gallery)

### 網站畫面

![Tiger Camera 首頁](assets/showcase/web-home.png)

![Tiger Camera 領取與後製頁](assets/showcase/web-create.png)

![Tiger Camera 公開相簿](assets/showcase/web-gallery.png)

## 使用流程

```text
按下快門
    ↓
相機拍攝並連線上傳私人草稿
    ↓
掃描 NFC，開啟 Tiger Camera 網站
    ↓
輸入螢幕上的六位領取碼
    ↓
在手機選擇版型、文字與濾鏡
    ↓
下載完成圖，或公開到相簿
```

領取碼是照片配對用的一次性代碼；照片在領取前保持私人狀態，公開與否由領取者決定。

## 技術組成

| 部分 | 使用技術 |
| --- | --- |
| 相機硬體 | ESP32-S3-WROOM-1-N16R8、OV2640、ST7735 TFT、實體快門 |
| 韌體 | Arduino-ESP32、PlatformIO、PSRAM JPEG buffer |
| 前端 | Next.js、React、TypeScript、Tailwind CSS、shadcn/ui、Canvas API |
| 後端 | Next.js Route Handlers、Neon Serverless PostgreSQL、Cloudflare R2 |
| 儲存 | 原圖私人暫存；後製完成圖永久保存 |
| 電源 | 803040 LiPo、TP4056、MT3608、KCD1-11 |

## 快速啟動

需要 Node.js、pnpm，以及 Frontend／Backend 各自的本機環境變數。請勿將密碼、Token 或雲端金鑰提交到 Git。

```powershell
cd web
pnpm install
pnpm --dir backend dev
```

另開一個終端機啟動前端：

```powershell
cd web
pnpm --dir frontend dev
```

接著開啟 [http://localhost:3000](http://localhost:3000)。若只想查看靜態介面，也可以直接使用正式網站連結。

## 資料夾結構

```text
tiger-camera/
├── firmware/       # ESP32-S3-CAM 韌體與 PlatformIO 專案
├── web/
│   ├── frontend/    # Next.js 網站、照片後製與公開相簿
│   ├── backend/     # Next.js API、照片儲存與管理功能
│   └── docs/        # Web 相關文件
├── enclosure/      # 外殼 CAD 與尺寸資料
├── assets/         # 展示圖片與專案資產
├── bom/            # 材料與採購清單
└── docs/           # 硬體、軟體與測試紀錄
```

## 專案內容

```text
tiger-camera/
├── firmware/
│   ├── README.md
│   └── tiger-camera-v1/
│       ├── include/       # 腳位、相機、螢幕、快門、電池與網路模組
│       ├── src/           # Arduino-ESP32 韌體程式
│       ├── boards/        # ESP32-S3-CAM 板型設定
│       └── platformio.ini # PlatformIO 建置設定
├── web/
│   ├── frontend/          # 公開 Next.js 網站與手機後製介面
│   │   ├── app/           # 首頁、領取後製頁、公開相簿、管理頁
│   │   ├── api/           # Axios 前端呼叫層
│   │   ├── components/    # 共用 UI 與網站元件
│   │   └── lib/           # Canvas 圖片處理
│   ├── backend/           # 獨立部署的 Next.js API
│   │   ├── app/api/       # Route Handlers 與 API 文件頁
│   │   └── lib/           # Neon、R2、驗證與伺服器邏輯
│   └── docs/              # Web 架構與操作說明
├── enclosure/             # 外殼 CAD、STL、量測與參考圖
├── assets/                # 展示圖片與共用資產
│   └── showcase/          # README 使用的產品／網站截圖
├── bom/                   # 材料與採購清單
├── docs/                  # 硬體、軟體與測試文件
└── README.md              # 公開產品介紹
```

各資料夾內的 README 只說明該區域；根目錄 README 保持產品展示與快速導覽，方便第一次看到專案的人閱讀。
