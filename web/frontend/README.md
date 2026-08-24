# Tiger Camera Frontend

公開網站、NFC 領取、Canvas 後製、完成圖上傳、公開相簿與管理員 UI。Frontend 不放 Route Handlers 或 server-only secrets。

## 頁面

- `/`：專案介紹
- `/create`：輸入 6 位碼、領取私人草稿、後製、下載或公開
- `/gallery`：公開相簿、大圖 Dialog，以及每張卡片外側的直接下載按鈕
- `/admin`：Admin Bearer 登入、裝置與照片管理

分頁獨有元件放在該 route 的 `_components/`；共用 shadcn primitives 放 `components/ui/`，共用產品元件放 `components/`。前端 API 呼叫集中在根層 `api/`。

## 環境變數

```env
NEXT_PUBLIC_API_BASE_URL=https://api.tiger-camera.fengyenchia.com/api
```

這是唯一可公開的 URL。R2、Neon、JWT signing secret、Admin password hash 與 device credential 不得放在 Frontend。

## Token

- Claim UUID token：`sessionStorage`，Axios／fetch 以 Bearer 傳送。
- Admin JWT：依目前需求使用 `localStorage`，Axios 以 Bearer 傳送；因此禁止注入不可信 HTML，並維持 CSP／相依套件安全更新。

## Canvas

使用者可選拍立得框、拍攝日期、文字、復古濾鏡與基本調整，或全部不選。Canvas 輸出以原圖尺寸為基礎，不用畫面預覽尺寸當成下載尺寸。日期來自 API `capturedAt`，只選是否顯示。

公開相簿下載使用 `/api/photos/:id/image?download=1`；Backend 直接回傳 attachment。Dialog 內不重複放下載按鈕。

## 開發

```powershell
cd web
pnpm --dir frontend dev
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend build
```
