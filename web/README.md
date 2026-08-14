# Tiger Camera Web

網站已拆成兩個可獨立部署的 Next.js 專案：

```text
web/
├── frontend/   # 公開網站、NFC 領取、Canvas 後製、相簿與 Axios 呼叫層
├── backend/    # HTTP API、CORS、驗證、未來的 R2／Neon server-only 程式
├── docs/       # Web 架構與後端教學
└── package.json
```

- Frontend：`https://tiger-camera.fengyenchia.com`
- Backend：獨立 Vercel 專案；可使用 Vercel URL，或另設 `https://tiger-camera-api.fengyenchia.com`

完整功能、API、權限與待做清單見 [`docs/README.md`](docs/README.md)，後端實作步驟見 [`docs/backend-setup.md`](docs/backend-setup.md)。

## 本機開發

在 `web/` 執行：

```powershell
pnpm install
pnpm dev
```

這會同時啟動：

- Frontend：`http://localhost:3000`
- Backend：`http://localhost:3001`
- Backend health：`http://localhost:3001/api/health`

也可分開啟動：

```powershell
pnpm dev:frontend
pnpm dev:backend
```

品質檢查：

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

## 環境變數

Frontend 的 `frontend/.env.local`：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Backend 的 `backend/.env.local`：

```dotenv
FRONTEND_ORIGIN=http://localhost:3000,https://tiger-camera.fengyenchia.com
```

正式 R2、Neon、JWT 與 device credential 變數只放 Backend；不得加上 `NEXT_PUBLIC_`。

## Vercel 部署

同一個 Git repository 建立兩個 Vercel projects：

1. Frontend project 的 Root Directory 設為 `web/frontend`，綁定 `tiger-camera.fengyenchia.com`。
2. Backend project 的 Root Directory 設為 `web/backend`，使用 Vercel URL 或綁定 API 子網域。
3. Frontend 設定 `NEXT_PUBLIC_API_BASE_URL=https://你的後端網域/api`。
4. Backend 設定 `FRONTEND_ORIGIN=https://tiger-camera.fengyenchia.com`。

Backend 的 CORS 只允許白名單前端；ESP32、R2 與 Neon 的秘密只存在 Backend environment variables。

## 目前資料模式

Backend Route Handlers 仍是記憶體 Demo。`TIGER1` 可測試 claim、Canvas、下載與發布，但重新啟動、重新部署或 Serverless instance 回收後資料會消失。正式 Gate C0 才會換成 Cloudflare R2、Neon、device credential、安全 claim code、claim JWT 與 Admin JWT。

ESP32 韌體只負責裝置驗證與私人原圖上傳；NFC 直接開啟 hosted `/create`，沒有另一套區域網站。
