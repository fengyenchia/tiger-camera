# Tiger Camera Web 現況

本文件只記錄 Web。完整外部服務設定與 API 驗收教學見 [backend-setup.md](backend-setup.md)。

- Frontend：`https://tiger-camera.fengyenchia.com`
- Backend：`https://api.tiger-camera.fengyenchia.com`
- API 文件：`https://api.tiger-camera.fengyenchia.com/api/docs`

## 使用者流程

1. ESP32 以 device credential 建立草稿並 PUT 原始 JPEG 到私人 R2。
2. Backend `HeadObject` 確認後，回傳 6 位、24 小時有效的配對碼。
3. 使用者掃 NFC 開啟 `/create`，輸入配對碼並取得單張草稿 UUID token。
4. 瀏覽器暫時讀取原圖，執行 Canvas 拍立得框、拍攝時間、文字、基本調色與復古質感。
5. 使用者可只下載完成圖；只有勾選公開才上傳 finished JPEG 並 publish。
6. 公開成功後 Backend 刪除暫存原圖，`/gallery` 只顯示完成圖。
7. 管理員在 `/admin` 建立／撤銷裝置，並可一次永久刪除公開照片。

## 已完成的程式

### Frontend

- `/`、`/create`、`/gallery`、`/admin`。
- Canvas v2 支援拍立得框、日期、文字、亮度、對比、飽和度、色溫、顆粒、暗角、文字大小／位置與一鍵重設；日期只顯示 API 拍攝時間。
- 完成圖下載、presigned R2 PUT、publish、自動前往公開相簿與相簿大圖 Dialog。
- Admin JWT localStorage＋Axios Bearer、裝置管理與一次永久刪除 UI。
- Claim UUID token sessionStorage；Frontend 不保存 R2／Neon secrets。

### Backend

- `env.ts`：呼叫時驗證環境變數。
- `db.ts`：Neon Serverless Driver。
- `r2.ts`：PUT／GET presigned URL、HeadObject、DeleteObject。
- `device-auth.ts`：高熵 credential、SHA-256 lookup、撤銷。
- `admin-auth.ts`：bcrypt 登入與 30 分鐘 Admin JWT。
- `claim-auth.ts`／`claim-code.ts`：6 位配對碼與資料庫 UUID token。
- `drafts.ts`／`photos.ts`：狀態轉換、公開列表、刪除與 cleanup query。
- Device、Claim、Publish、Photos、Admin、Cron Route Handlers。
- Swagger UI `/api/docs` 與 OpenAPI `/api/openapi`。
- `vercel.json` 每日 cleanup；Hobby 方案可部署。

## 尚未由實際雲端驗證

- Neon migration 是否已由使用者執行。
- R2 bucket、API token、CORS 與真實 PUT／HEAD／GET／DELETE。
- Vercel Frontend／Backend Production variables、custom domains 與 DNS。
- 首筆 Admin 登入及第一個 device credential。
- 真實「測試 JPEG→領取→Canvas→公開→刪除」E2E。
- iPhone Safari、Android Chrome、斷網與並發測試。
- ESP32 韌體串接與 hotspot reconnect。
- IndexedDB 完成圖離線重試；這仍是後續可靠性功能。

## API

| Method | Path | 權限 |
|---|---|---|
| `POST` | `/api/device/drafts/initiate` | Device Bearer |
| `POST` | `/api/device/drafts/:id/complete` | Device Bearer |
| `POST` | `/api/drafts/claim` | 公開 6 位碼 |
| `GET` | `/api/drafts/:id/image` | Claim UUID Bearer |
| `POST` | `/api/drafts/:id/process/initiate` | Claim UUID Bearer |
| `POST` | `/api/drafts/:id/publish` | Claim UUID Bearer |
| `GET` | `/api/photos` | 公開 |
| `GET` | `/api/photos/:id/image` | 公開 active 完成圖 |
| `POST` | `/api/admin/login` | 管理員帳密 |
| `GET/POST` | `/api/admin/devices` | Admin JWT |
| `PATCH` | `/api/admin/devices/:id` | Admin JWT |
| `DELETE` | `/api/photos/:id` | Admin JWT |
| `GET` | `/api/cron/cleanup` | `CRON_SECRET` |

## 本機開發

```powershell
cd web
pnpm install
pnpm dev
```

- Frontend：`http://localhost:3000`
- Backend：`http://localhost:3001`
- Admin：`http://localhost:3000/admin`
- Swagger：`http://localhost:3001/api/docs`

品質檢查：

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

## 安全邊界

- 6 位碼只是配對，不是安全密碼；第一次領取後清除。
- Claim token 是資料庫保存的 draft-scoped UUID，不是 JWT。
- Device credential 只允許上傳並可撤銷。
- Admin JWT 才能管理裝置與永久刪除。
- R2、Neon、JWT、bcrypt 與 Cron secrets 永遠不加 `NEXT_PUBLIC_`。
- 公開 API 永遠不回傳暫存原圖 key。
- 原圖 UI 不提供下載，但 Canvas 取得 bytes，因此這不是 DRM。

## 下一步

1. 依 [backend-setup.md](backend-setup.md) 建立 Neon 與執行 migration。
2. 建立 private R2 bucket、token 與 CORS。
3. 填入 Backend／Frontend `.env.local`，本機啟動兩個專案。
4. 使用 `/admin` 登入並建立第一台測試裝置，立即保存只顯示一次的 credential。
5. 用 Postman／curl 模擬 Device initiate→PUT→complete。
6. 從 `/create` 領取、後製、下載及公開，再從 `/admin` 永久刪除。
7. 全流程通過後部署兩個 Vercel projects，設定 Production variables 與 DNS。
