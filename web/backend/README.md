# Tiger Camera Backend

獨立部署的 Next.js API，負責 Neon metadata、私人 Cloudflare R2、固定相機 upload token／Claim／Admin auth、cleanup 與 Swagger。Vercel Root Directory 是 `web/backend`。

## 正式網址

- API：`https://api.tiger-camera.fengyenchia.com`
- Swagger UI：`/api/docs`
- OpenAPI JSON：`/api/openapi`

## 主要 API

| Method | Route | Auth | 說明 |
| --- | --- | --- | --- |
| POST | `/api/device/drafts/initiate` | `DEVICE_UPLOAD_TOKEN` Bearer | 建立草稿與 original PUT URL |
| POST | `/api/device/drafts/:id/complete` | `DEVICE_UPLOAD_TOKEN` Bearer | 驗證 object、回領取碼 |
| POST | `/api/drafts/claim` | Code | 消耗代碼、回 claim UUID token |
| GET | `/api/drafts/:id/image` | Claim Bearer | Backend 直接代理私人 JPEG |
| POST | `/api/drafts/:id/process/initiate` | Claim Bearer | 建立 processed PUT URL |
| POST | `/api/drafts/:id/publish` | Claim Bearer | 確認完成圖與公開選擇 |
| GET | `/api/photos` | Public | 公開 metadata |
| GET | `/api/photos/:id/image` | Public | 一般檢視 redirect；`?download=1` 直接回 JPEG attachment |
| POST | `/api/admin/login` | Public | Admin JWT |
| DELETE | `/api/admin/photos/:id` | Admin Bearer | 一次永久刪除 |
| GET | `/api/cron/cleanup` | Cron secret | 清理逾期與待刪物件 |

## 開發

```powershell
cd web
pnpm --dir backend dev
pnpm --dir backend lint
pnpm --dir backend typecheck
pnpm --dir backend build
```

環境變數範例在 `.env.example`。R2、Neon、Admin、JWT、`DEVICE_UPLOAD_TOKEN` 與 Cron secrets 只放 Backend，絕不使用 `NEXT_PUBLIC_`。固定 token 至少 32 bytes，且值必須與韌體 `secrets.h` 相同。bcrypt hash 中的 `$` 在本機 `.env.local` 應直接保存完整字串；在可能做 shell expansion 的環境要依平台規則轉義。

既有 Neon 專案切換前，先執行 `lib/server/migrations/002_fixed_device_upload_token.sql`，再執行 `lib/server/migrations/003_filter_presets_canvas_v3.sql`，最後部署 Backend。002 讓新草稿不必填 `device_id`，並新增全域 `client_request_id` 唯一約束；003 新增 Canvas v3 濾鏡值。`jungle-green` 只保留給歷史 metadata，新發布 API 不再接受它。

正式雲端與實機功能流程已跑通；發布前強化項目見 [`../docs/README.md`](../docs/README.md)。完整設定見 [`../docs/backend-setup.md`](../docs/backend-setup.md)。
