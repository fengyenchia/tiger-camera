# Tiger Camera Web

本文件只說明 `web/` hosted Next.js 網站的功能、使用方式、程式結構、限制與待做事項。

正式網址預定為 `https://tiger-camera.fengyenchia.com`。目前是本機前端原型，使用記憶體 Demo API，尚未部署，也沒有 authentication、資料庫或永久物件儲存。

## 目前功能

### 已完成

- `/`：簡化的網站介紹首頁。
- `/gallery`：JPEG 選檔上傳、照片列表與單次操作直接刪除。
- 固定 Navbar：向下捲動時隱藏，向上回捲一小段時顯示。
- 共用 Footer 與 GitHub 連結。
- Axios 共用 client、照片 API functions 與共享 types。
- Next.js 記憶體 Demo Route Handler。
- JPEG MIME 與單檔 8 MB 上限檢查。
- 上傳、讀取與刪除的 loading／success／error 文字回饋。
- 按一次刪除即直接執行；V1 不設確認視窗、垃圾桶與還原。
- 響應式 base＋`md:` 兩段樣式。
- Noto Sans TC Variable Font、Tabler Icons 與本地 shadcn/ui-style 元件。

### 尚未完成

- 管理員登入、session 與受保護路由。
- PostgreSQL 照片 metadata。
- 私人物件儲存與短效上傳／讀取網址。
- 原圖與後製圖分開上傳及完成確認。
- Canvas 復古後製、拍攝日期與拍立得邊框。
- IndexedDB 離線待傳、斷線重試與下載備援。
- 可重試的正式永久刪除流程。
- 自動化測試與真實 JPEG fixtures。
- Vercel 部署、子網域 DNS 與 HTTPS。

## 本機開發

在 repository 根目錄執行：

```powershell
cd web
pnpm install
pnpm dev
```

開啟：

- 首頁：`http://localhost:3000`
- 相簿：`http://localhost:3000/gallery`

品質檢查：

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

目前 `package.json` 尚未提供獨立的 format 或 test script。

## 功能用法

### 首頁

1. 開啟 `/`。
2. 使用 Navbar 切換「首頁」與「相簿」。
3. 按「打開我的相簿」前往 `/gallery`。
4. GitHub 按鈕會另開專案 repository。

Navbar 使用 Motion 的 `useScroll` 與 `useMotionValueEvent`：

- 向下捲動超過約 18 px 後隱藏。
- 向上累積回捲約 24 px 後重新顯示。
- 使用者啟用 reduced motion 時不執行位移動畫。

### 上傳 JPEG

1. 開啟 `/gallery`。
2. 按「選擇照片」。
3. 選擇 `image/jpeg` 檔案。
4. 單檔必須小於或等於 8 MB。
5. 成功後照片會加入「最近收藏」。

目前 Demo 使用 `FileReader` 把 JPEG 轉成 Data URL，並把同一份資料同時指定給 `originalUrl` 與 `processedUrl`。正式版必須改成兩個不同且不可覆寫的私人物件。

### 相簿列表

- 每張照片顯示縮圖、標題與日期。
- 照片 hover 時使用 `transition-all duration-600` 放大。
- `filterPreset` 來自照片 metadata。
- Demo 的 `Tiger Film`、`Baby Tiger`、`Night Hunter` 只是測試資料。
- `filterPreset` 標籤不是必要功能；若要讓卡片更簡潔，可移除或改到照片詳細頁顯示。

### 刪除照片

1. 按照片卡右側的刪除圖示。
2. 網站立即送出永久刪除要求並顯示處理結果，不再顯示確認視窗。

目前 Demo 只會從記憶體陣列移除資料。正式版必須先將 metadata 改為 `deleting`，刪除原圖與後製圖，確認兩個物件都不存在後才刪 metadata；部分失敗時必須保留可重試狀態。

## 前端 API 結構

前端 Axios 呼叫層位於 `app/` 外：

```text
web/api/
├── common.ts   # Axios instance 與共用設定
├── photos.ts   # 照片列表、建立與刪除 functions
└── types.ts    # Photo 與 API response types
```

### `api/common.ts`

- 建立共用 `apiClient`。
- `baseURL` 優先使用 `NEXT_PUBLIC_API_BASE_URL`，未設定時使用 `/api`。
- timeout 為 15 秒。
- 預設 `Content-Type: application/json`。

`NEXT_PUBLIC_` 變數會進入瀏覽器 bundle，不得放資料庫密碼、Object Storage secret 或長效 token。

### `api/photos.ts`

提供：

- `listPhotos()`
- `createPhoto(input)`
- `permanentlyDeletePhoto(id)`

React 元件只透過這些 functions 呼叫後端，不直接散落 Axios request。

### `api/types.ts`

目前包含：

- `Photo`
- `CreatePhotoInput`
- `PhotoListResponse`

與特定 API 有關的型別統一留在 `web/api/`，不另外建立根層 `types/`。

## 前後端架構

V1 不拆成 `frontend/` 與 `backend/` 兩個專案。`web/` 是一個可一起開發、測試與部署的 full-stack Next.js 應用，但程式依責任分層：

- `app/`、`components/`：頁面與 UI。
- `api/`：瀏覽器使用的 Axios client、功能 API 與相關 types；這個資料夾不會產生 API 網址。
- `app/api/`：只在 Server 執行的 Route Handlers；這裡才會產生 `/api/...` 網址。
- `lib/server/`：驗證、資料庫、物件儲存等伺服器邏輯；不得被 Client Component import。

因此畫面上雖然有兩個名為 `api` 的路徑，但不是兩套後端。等到後端需要獨立部署、長時間背景工作、多個不同客戶端，或必須獨立擴縮時，再評估拆成兩個專案。

## Next.js Demo API

Route Handler：

```text
web/app/api/photos/route.ts
```

| Method | Path | 用途 |
|---|---|---|
| `GET` | `/api/photos` | 取得記憶體照片列表 |
| `POST` | `/api/photos` | 建立一筆 Demo 照片 |
| `DELETE` | `/api/photos` | 以 JSON body 的 `id` 刪除 Demo 照片 |

建立照片 body：

```json
{
  "title": "今天的照片",
  "originalUrl": "data:image/jpeg;base64,...",
  "processedUrl": "data:image/jpeg;base64,...",
  "filterPreset": "Original"
}
```

刪除照片 body：

```json
{
  "id": "photo-id"
}
```

Demo 資料位於 `lib/server/demo-photo-store.ts`。開發伺服器重啟、重新部署或 Serverless instance 回收後，新增內容會消失。

## 正式 Web API 流程

正式版不應把完整 JPEG Data URL POST 到 Next.js application server，預定流程為：

1. `POST /api/photos/initiate`：驗證登入、JPEG MIME 與大小，建立 photo ID。
2. Server 回傳兩個短效且限定 pathname 的上傳網址。
3. 瀏覽器直接 `PUT` 原圖與後製圖到不同物件。
4. `POST /api/photos/:id/complete`：Server 用 storage `head` 驗證兩個物件。
5. 驗證完成後才把照片改為 `active` 並顯示「已永久保存」。
6. `GET /api/photos`：只列出登入管理員可以讀取的照片。
7. `GET /api/photos/:id/image?variant=original|processed`：驗證登入後提供短效讀取網址。
8. `DELETE /api/photos/:id`：單次操作後執行可重試的永久刪除。

## Web 目錄

```text
web/
├── api/                       # Axios client、照片 API、API types
├── app/
│   ├── api/photos/route.ts    # 記憶體 Demo Route Handler
│   ├── gallery/page.tsx       # 相簿頁
│   ├── globals.css            # tokens、字體、全域樣式
│   ├── layout.tsx             # 共用 Navbar 與 Footer
│   └── page.tsx               # 介紹首頁
├── components/
│   ├── gallery/
│   │   ├── gallery-client.tsx
│   │   ├── photo-card.tsx
│   │   └── upload-panel.tsx
│   ├── ui/                    # Button、Card、Badge 等共用元件
│   ├── site-navbar.tsx
│   └── site-footer.tsx
├── docs/README.md             # 本文件
├── lib/
│   ├── server/demo-photo-store.ts
│   └── utils.ts
└── public/
    ├── fonts/NotoSansTC-VF.ttf
    ├── images/logo.png
    └── samples/               # Demo SVG 照片
```

## UI 規範

- 配色：奶油底、珊瑚紅、粉紅、黃色與淺藍。
- 不使用漸層。
- 全站字體使用 `/fonts/NotoSansTC-VF.ttf`。
- 圖示使用 `@tabler/icons-react`。
- UI primitives 放在 `components/ui/`。
- hover 統一使用 `transition-all duration-600`。
- 響應式只分兩段：base 為小螢幕；桌機差異只使用 `md:`。
- 互動元素保留 focus ring、足夠的觸控尺寸與 reduced-motion fallback。

常用 tokens 位於 `app/globals.css`：

- 顏色：`--primary`、`--secondary`、`--accent`、`--pink`、`--yellow`、`--blue`、`--destructive`。
- 圓角：`--rounded-primary`、`--rounded-secondary`、`--rounded-small`、`--rounded-pill`。
- 動畫：`--duration-600`。

## 已知限制

- 沒有登入，任何能存取網站的人都能呼叫 Demo API。
- 沒有資料庫與永久儲存。
- 沒有短效 upload URL 或 private read URL。
- 原圖與後製圖目前是同一份 Data URL。
- 沒有 Canvas 復古後製。
- 沒有 IndexedDB 離線待傳。
- 沒有照片詳細頁、下載原圖或下載後製圖。
- Demo SVG 只用於版面測試，不是真實 JPEG fixture。
- 尚未部署到 `tiger-camera.fengyenchia.com`。
- 尚未完成 375 px 與桌機寬度的正式視覺驗收。

## Web 待做清單

### UI 與測試

- [ ] 決定相簿卡片是否移除 `filterPreset` 標籤。
- [ ] 加入真實 landscape、portrait、low-light JPEG fixtures。
- [ ] 加入 format script。
- [ ] 加入 API 與元件單元測試。
- [ ] 加入上傳、列表、單次永久刪除與刪除失敗 E2E 測試。
- [ ] 實測 375 px 與桌機寬度。
- [ ] 驗證鍵盤操作、focus、screen reader 與 reduced motion。
- [ ] 確認大型 Noto Sans TC font 對初次載入效能的影響；需要時做合法 subset。

### Authentication 與權限

- [ ] 建立單一管理員登入。
- [ ] 使用 HttpOnly、Secure session cookie。
- [ ] 保護 `/gallery`。
- [ ] 保護所有照片 API。
- [ ] 驗證未登入者不能列出、讀取、上傳或刪除照片。
- [ ] 加入登入速率限制與安全錯誤訊息。

### Database 與 Object Storage

- [ ] 建立 PostgreSQL `photos` migration。
- [ ] 使用 `uploading`、`active`、`deleting` 狀態。
- [ ] 建立 Private Object Storage。
- [ ] 為原圖與後製圖使用不同唯一 pathname。
- [ ] 實作短效、path-scoped upload URL。
- [ ] 實作受保護的短效讀取 URL。
- [ ] 清理逾時 `uploading` 記錄與物件。
- [ ] 防止相同 `clientRequestId` 重試產生重複照片。

### 上傳與後製

- [ ] 保留原始 JPEG Blob，不可覆寫。
- [ ] 實作 Canvas 復古處理、拍攝日期與拍立得邊框，並產生獨立 processed Blob。
- [ ] 驗證 landscape、portrait、low-light 與大圖記憶體使用。
- [ ] 實作 `initiate → PUT original／processed → complete`。
- [ ] 只有 Server 確認兩個物件後才顯示「已永久保存」。
- [ ] 加入原圖與後製圖下載。

### 離線與錯誤恢復

- [ ] 建立 IndexedDB 待傳佇列。
- [ ] 顯示 `pending／uploading／saved／failed` 狀態。
- [ ] 網路恢復後可安全重試。
- [ ] 永久刪除部分失敗時維持 `deleting` 並可重試。
- [ ] 不得把失敗的上傳或刪除顯示為成功。

### 部署

- [x] 建立 Vercel project。
- [ ] 連接完整 Git repository，並將 Vercel Root Directory 設為 `web`。
- [ ] 設定 production environment variables。
- [ ] 連接 `tiger-camera.fengyenchia.com`。
- [ ] 設定 DNS 與 HTTPS。
- [ ] 驗證 production bundle 沒有秘密或長效 token。
- [ ] 在正式環境重跑 lint、typecheck、tests 與 production build。

Vercel 設定順序：

1. 將完整 `tiger-camera` Git repository 連接到 Vercel project；Git 不會只推送單一資料夾。
2. 在 Project Settings → Build and Deployment 將 Root Directory 設為 `web`。
3. Framework Preset 使用 Next.js；Install、Build 與 Output Directory 先保留自動偵測值。
4. 部署成功後，再到 Domains 加入 `tiger-camera.fengyenchia.com` 並依 Vercel 顯示的紀錄設定 DNS。
5. 正式資料庫、Object Storage 與登入完成後，才加入對應的 server-only environment variables。

目前部署只能用於 UI 與記憶體 Demo API 預覽。照片不會永久保存，且 Serverless instance、重新部署或冷啟動都可能讓 Demo 資料消失。
