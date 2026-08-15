# Tiger Camera Backend

獨立部署的 Next.js API，負責 Neon metadata、私人 Cloudflare R2 物件、裝置驗證、6 位領取碼、UUID claim token、Admin JWT 與 cleanup cron。正式 Vercel Root Directory 是 `web/backend`。

## 已實作 API

| Method | Path | 權限 | 用途 |
|---|---|---|---|
| `GET` | `/api/health` | 公開 | 部署健康檢查 |
| `GET` | `/api/docs` | 公開 | Swagger UI |
| `GET` | `/api/openapi` | 公開 | OpenAPI JSON |
| `POST` | `/api/device/drafts/initiate` | Device Bearer | 建立草稿與 original PUT URL |
| `POST` | `/api/device/drafts/:id/complete` | Device Bearer | HeadObject 驗證並取得領取碼 |
| `POST` | `/api/drafts/claim` | 公開 | 消耗 6 位碼並取得 UUID token |
| `GET` | `/api/drafts/:id/image` | Claim Bearer | 私人原圖短效 GET redirect |
| `POST` | `/api/drafts/:id/process/initiate` | Claim Bearer | 完成圖 PUT URL |
| `POST` | `/api/drafts/:id/publish` | Claim Bearer | 驗證完成圖、公開並清除原圖 |
| `GET` | `/api/photos` | 公開 | 列出 active 完成圖 |
| `GET` | `/api/photos/:id/image` | 公開 | 公開完成圖短效 GET redirect |
| `POST` | `/api/admin/login` | 公開 | 取得 30 分鐘 Admin JWT |
| `GET/POST` | `/api/admin/devices` | Admin JWT | 列出或建立裝置 |
| `PATCH` | `/api/admin/devices/:id` | Admin JWT | 撤銷／啟用裝置 |
| `DELETE` | `/api/photos/:id` | Admin JWT | 一次永久刪除 |
| `GET` | `/api/cron/cleanup` | `CRON_SECRET` | 清理逾期與待刪物件 |

程式已完成型別與建置驗證，但尚未使用使用者的真實 Neon、R2 與 Vercel Production 做端到端測試；完成外部設定前不能視為已上線。

## 本機執行

```powershell
cd web/backend
Copy-Item .env.example .env.local
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

完整環境變數範例見 `.env.example`。所有 R2、Neon、Admin 與 Cron 值只能放 Backend，不得加 `NEXT_PUBLIC_`。

產生 bcrypt 管理員密碼雜湊：

```powershell
pnpm admin:hash-password
```

腳本輸入會顯示在終端，請只在私人終端執行，不要錄影或分享輸出。完整雜湊填入 `ADMIN_PASSWORD_HASH`。

## 資料庫

在 Neon SQL Editor 執行：

```text
lib/server/migrations/001_devices_and_photos.sql
```

不要再執行舊的 `claim_code_hash` schema。正式 schema 使用 plaintext `claim_code` 與 UUID `claim_token`。

## Swagger

- Local Swagger：`http://localhost:3001/api/docs`
- Local OpenAPI：`http://localhost:3001/api/openapi`
- Production Swagger：`https://api.tiger-camera.fengyenchia.com/api/docs`

Swagger Authorize 只供開發測試，不得把真實 credential、JWT、資料庫或 R2 secrets 寫入 JSDoc 或 Git。
