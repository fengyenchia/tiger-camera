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

設計 token 位於 `app/globals.css`。顏色只保留 `background`、`foreground`、`primary`、`secondary`、`accent` 五種，其餘狀態使用透明度；圓角只保留 `rounded-primary` 與 `rounded-pill`。

內文使用 Noto Sans TC；所有中英文 `h1`～`h6`、品牌名稱與英文 eyebrow 統一使用 `font-title`（Chiron GoRound TC）。

## Component 放置規則

- 只有單一路由使用的元件，放在該路由的 `app/<route>/_components/`。
- 多個頁面共用的網站元件，放在根層 `components/`。
- shadcn 風格的通用 UI primitive，放在 `components/ui/`。
- `_components` 是 App Router 的 private folder，不會產生額外網址。
