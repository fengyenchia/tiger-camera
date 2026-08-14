# Tiger Camera Backend

獨立部署的 Next.js API。Route Handlers 位於 `app/api/`；未來的 R2、Neon 與驗證模組放在 `lib/server/`。本專案不放頁面、Canvas 或瀏覽器 Axios client。

```powershell
cd web/backend
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

本機 API：`http://localhost:3001/api`。健康檢查：`GET /api/health`。

目前只有記憶體 Demo API；正式資料層尚未完成。正式 Vercel Root Directory：`web/backend`。

所有 R2、Neon、Admin JWT、Claim JWT 與 device secrets 只能設定在這個 Backend project。`FRONTEND_ORIGIN` 控制瀏覽器 CORS 白名單。
