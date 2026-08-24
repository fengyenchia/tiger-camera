# Tiger Camera Web

Web 採前後端分離的兩個 Next.js 專案，但仍保存在同一個 pnpm workspace：

```text
web/
├── frontend/   # UI、Axios、Canvas、相簿與管理介面
├── backend/    # Route Handlers、Neon、R2、驗證與 Cron
├── docs/       # Web 與後端教學
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

根目錄的 package／lock／workspace 檔是必要的 monorepo 設定；`.next/` 與 `node_modules/` 是可重建產物，不進 Git。

## 正式服務

- Frontend：`https://tiger-camera.fengyenchia.com`
- Backend：`https://api.tiger-camera.fengyenchia.com`
- Swagger：`https://api.tiger-camera.fengyenchia.com/api/docs`

Neon、R2、Vercel、DNS 與實機上傳／領取的功能流程已接通。發布前仍要補跨手機、壓力、裝置撤銷與清理一致性測試。

公開 API endpoint 與 `NEXT_PUBLIC_API_BASE_URL` 會進入瀏覽器 bundle，本來就不是秘密。Neon URL、R2 keys、Admin／JWT secrets、device credential 與本機 Postman environment 則由根目錄及本目錄 `.gitignore` 排除。

## 開發

```powershell
cd web
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

環境變數與部署流程見 [`docs/backend-setup.md`](docs/backend-setup.md)，目前功能與待辦見 [`docs/README.md`](docs/README.md)。
