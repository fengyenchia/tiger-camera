# Tiger Camera Web

網站是兩個可獨立部署的 Next.js 專案：

```text
web/
├── frontend/   # 頁面、Canvas、Axios 與管理員 UI
├── backend/    # HTTP API、Neon、R2、驗證與 Cron
└── docs/       # 功能狀態與後端操作教學
```

- Frontend：`https://tiger-camera.fengyenchia.com`
- Backend：`https://api.tiger-camera.fengyenchia.com`

正式 Gate C0 程式已完成：Device initiate／complete、6 位碼、UUID claim、私人原圖、完成圖 PUT／publish、公開相簿、Admin JWT、裝置撤銷、永久刪除與 cleanup。尚待使用者建立／設定 Neon、R2、Vercel、DNS 並執行真實雲端 E2E，因此目前不是已部署完成狀態。

## 本機開發

```powershell
cd web
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

- Frontend：`http://localhost:3000`
- Backend：`http://localhost:3001`
- Swagger：`http://localhost:3001/api/docs`

Frontend `.env.local`：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Backend 依 `backend/.env.example` 建立 `.env.local`。密鑰只放 Backend；Claim 使用資料庫 UUID，不需要 `CLAIM_JWT_SECRET` 或 `CLAIM_CODE_HMAC_SECRET`。

完整外部設定與驗收步驟見 [`docs/backend-setup.md`](docs/backend-setup.md)，最新功能與待辦見 [`docs/README.md`](docs/README.md)。
