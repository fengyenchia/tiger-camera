# Tiger Camera Frontend

公開網站、NFC 領取、Canvas 後製與相簿 UI。這個專案不包含 Route Handlers 或 server-only secrets。

```powershell
cd web/frontend
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

必要環境變數：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

正式 Vercel Root Directory：`web/frontend`。正式網域：`https://tiger-camera.fengyenchia.com`。
