# Tiger Camera Frontend

公開網站、NFC 領取、Canvas 後製、完成圖 R2 上傳、公開相簿與管理員 UI。Frontend 不包含 Route Handlers 或 server-only secrets。

## 頁面

- `/`：首頁。
- `/create`：6 位領取碼、私人原圖、Canvas 預覽、完成圖下載與可選公開。
- `/gallery`：所有人可看的 active 完成圖。
- `/admin`：管理員登入、建立／撤銷裝置與一次永久刪除照片。

後製可獨立開關拍立得框、拍攝時間、文字與復古濾鏡，也可全部關閉。拍攝時間來自 API，不提供日期選擇器。原圖只存在目前頁面記憶體；UI 只提供完成圖下載。

```powershell
cd web/frontend
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

必要環境變數：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

正式值：

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.tiger-camera.fengyenchia.com/api
```

這是唯一可公開的 API URL；R2、Neon、Admin secrets 不得放在 Frontend。Admin JWT 依既定需求保存在 localStorage，Claim UUID token 保存在 sessionStorage，兩者都由 Axios／fetch 主動放入 `Authorization: Bearer`。

頁面專用 component 位於 `app/<route>/_components/`；跨頁網站元件位於 `components/`；shadcn-style primitive 位於 `components/ui/`。
