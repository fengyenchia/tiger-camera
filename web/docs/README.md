# Tiger Camera Web

本文件說明 `web/frontend/` 與 `web/backend/` 兩個可獨立部署的 Next.js 專案。正式後端的逐步教學見 [backend-setup.md](backend-setup.md)。

正式網址：`https://tiger-camera.fengyenchia.com`。

## 使用者流程

1. 相機透過手機熱點／可信任 Wi-Fi 上傳私人草稿。
2. 上傳成功後，相機螢幕顯示 6～8 位領取碼。
3. 使用者掃機身 NFC，開啟 `/create`。
4. 輸入領取碼，取得該張私人照片的短效 claim token。
5. 在自己的手機選擇框、日期、文字與復古濾鏡。
6. 下載原圖／後製圖，或明確選擇公開。
7. 只有公開後的 `active` 照片會出現在 `/gallery`。

NFC 固定指向 `/create`；V1 不使用 QR Code、不直接讀取 `192.168.4.1`，也不提供手動選檔作為主要流程。

## 目前已完成

- `/`：介紹首頁與領取／公開相簿入口。
- `/create`：領取碼表單、Demo 私人草稿、Canvas 後製、下載與可選公開。
- `/gallery`：公開照片列表；未完成管理員驗證前不顯示刪除按鈕。
- Demo code：`TIGER1`。
- Demo claim API：`POST /api/drafts/claim`。
- Demo publish API：`POST /api/drafts/:id/publish`，要求 photo-scoped Demo Bearer token。
- 記憶體照片 API 與 Demo store。
- 拍立得框、日期、文字與四款復古濾鏡；可以全部關閉。
- 自訂文字、五句預設文字、原圖／後製圖下載。
- Navbar、Footer、Motion 捲動行為、Tabler Icons、shadcn-style primitives。
- 內文使用 Noto Sans TC Variable Font；所有中英文標題使用 `font-title`／Chiron GoRound TC。

## 尚未完成

- ESP32 device credential、device initiate／complete 與真正原圖上傳。
- Neon `devices`／`photos` schema 與安全領取碼 HMAC。
- 正式 claim JWT、私人 R2 original read、processed presigned PUT 與 publish。
- 管理員 JWT、裝置撤銷、草稿管理與永久刪除權限。
- IndexedDB processed 待傳／重試。
- 草稿逾時清理與 Vercel Cron。
- 真實 JPEG fixtures、自動測試與實機手機驗證。
- Vercel production variables、DNS 與 HTTPS。

## 本機開發

```powershell
cd web
pnpm install
pnpm dev
```

入口：

- 首頁：`http://localhost:3000`
- 領取／後製：`http://localhost:3000/create`
- 公開相簿：`http://localhost:3000/gallery`
- Backend health：`http://localhost:3001/api/health`

品質檢查：

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

目前沒有獨立 format／test script。

## Demo 操作

1. 開啟 `/create`。
2. 輸入 `TIGER1`。
3. Demo claim API 回傳單張草稿與短效概念 token。
4. 選擇 Canvas 後製項目。
5. 可下載原圖／後製圖；下載不會公開。
6. 勾選「公開到網站相簿」後按公開。
7. 到 `/gallery` 查看結果。

Demo 使用 SVG fixture 與記憶體資料，不代表正式 JPEG、R2、Neon 或安全驗證已完成。開發伺服器重啟、部署或 Serverless instance 回收後資料會消失。

## Frontend 與 Backend 的 API 資料夾

```text
web/frontend/api/
├── common.ts       # Axios instance
├── drafts.ts       # claim／publish browser functions
├── photos.ts       # public list／Demo photo functions
└── types.ts        # request／response types

web/backend/app/api/
├── drafts/         # Next.js Route Handlers，真正產生 /api/drafts/...
├── photos/         # Next.js Route Handlers，真正產生 /api/photos/...
└── health/         # Backend 部署健康檢查
```

`web/frontend/api/` 是 Axios 呼叫層，不會產生 HTTP endpoint；`web/backend/app/api/` 才是真正的 Server endpoint。`web/backend/lib/server/` 放 Neon、R2、auth、claim 等 server-only 邏輯。兩個專案不互相 import 原始碼，只透過 HTTPS API contract 溝通。

Frontend 的 `NEXT_PUBLIC_API_BASE_URL` 指向 Backend 的 `/api`；Backend 的 `FRONTEND_ORIGIN` 是逗號分隔的 CORS 白名單。Bearer token 仍由 Axios 明確放入 `Authorization` header，不使用跨網域 cookie。

## 正式 API 摘要

| API | 呼叫者 | 用途 |
|---|---|---|
| `POST /api/device/drafts/initiate` | ESP32 Device Bearer | 建立私人原圖草稿 |
| `POST /api/device/drafts/:id/complete` | ESP32 Device Bearer | 確認 R2 原圖並取得領取碼 |
| `POST /api/drafts/claim` | 公開＋code rate limit | code 換 photo-scoped claim token |
| `GET /api/drafts/:id/image` | Claim Bearer | 讀取該張私人原圖 |
| `POST /api/drafts/:id/process/initiate` | Claim Bearer | 取得 processed PUT URL |
| `POST /api/drafts/:id/publish` | Claim Bearer | 驗證 processed 並改為 active |
| `GET /api/photos` | 公開 | 列出 active 照片 |
| `DELETE /api/photos/:id` | Admin Bearer JWT | 一次永久刪除 |

## 權限規則

- 公開訪客：只看 `active` 相簿。
- 領取碼持有者：只處理該張草稿，不需要管理員帳號。
- ESP32：只能建立私人草稿；device credential 可撤銷。
- 管理員：裝置管理、草稿清理與永久刪除。
- 隱藏按鈕不是安全邊界；每個 Route Handler 都要驗證正確 token 類型與 scope。

Admin JWT 依使用者決策保存於 localStorage，由 Axios interceptor 主動帶 `Authorization: Bearer`。Claim token 使用不同 audience，建議只放記憶體／sessionStorage。

## Web 目錄

```text
web/
├── frontend/
│   ├── api/
│   ├── app/create/
│   ├── app/gallery/
│   ├── components/
│   ├── lib/photo-processing/
│   └── public/
├── backend/
│   ├── app/api/drafts/
│   ├── app/api/photos/
│   ├── app/api/health/
│   ├── lib/server/
│   └── proxy.ts
└── docs/
```

## UI 規範

- 全站只定義五個基礎色：`background`、`foreground`、`primary`、`secondary`、`accent`；hover、弱文字、表面與框線都使用透明度，不再增加近似色。
- 圓角只保留 `rounded-primary` 與 `rounded-pill`。
- 奶油底、珊瑚紅、粉紅與黃色；不使用漸層。
- 內文使用 `/fonts/NotoSansTC-VF.ttf`；所有 `h1`～`h6`、品牌名稱與英文 eyebrow 使用 `font-title`，來源為 `/fonts/ChironGoRoundTC-VariableFont_wght.ttf`。
- 圖示使用 `@tabler/icons-react`。
- 元件優先使用本地 shadcn/ui-style primitives。
- hover 使用 `transition-all duration-600`。
- 響應式只分 base 與 `md:`。
- 保留 focus ring、足夠觸控尺寸、ARIA live status 與 reduced-motion fallback。

## 待做清單

### 後端與安全

- [ ] 建立 `devices`／`photos` migration。
- [ ] 建立可撤銷 device credential 與 hash lookup。
- [ ] 實作裝置 original initiate／PUT／complete。
- [ ] 實作安全亂數 claim code、HMAC、expiry、rate limit 與原子領取。
- [ ] 實作 claim JWT、私人原圖與 processed upload／publish。
- [ ] 實作 Admin JWT localStorage＋Axios Bearer 與 scope 隔離。
- [ ] 實作草稿 cleanup cron、裝置撤銷及管理員一次永久刪除。

### 後製與 UI

- [x] 領取碼 Demo 與 claim state。
- [x] 四項複選、自訂／預設／無文字及全部關閉。
- [x] 原圖／後製圖下載與可選公開。
- [ ] 將 resolved text 與完整 processing metadata 傳到正式 publish API。
- [ ] 加入真實 landscape、portrait、low-light JPEG fixtures。
- [ ] 實測 375 px、桌機、鍵盤、screen reader 與 reduced motion。

### 測試與部署

- [ ] Claim code 競爭、暴力嘗試、過期與 token scope 測試。
- [ ] Device idempotency、R2 failure、hotspot reconnect 與 cleanup 測試。
- [ ] 公開列表、publish、管理員永久刪除 E2E。
- [x] 建立原本的 Vercel project；將它作為 Frontend。
- [ ] Frontend Vercel Root Directory 改為 `web/frontend`，連接 `tiger-camera.fengyenchia.com`。
- [ ] 新建 Backend Vercel project，Root Directory 設為 `web/backend`。
- [ ] Frontend 設定 `NEXT_PUBLIC_API_BASE_URL`；Backend 設定 `FRONTEND_ORIGIN` 與所有 server-only secrets。
- [ ] 驗證跨網域 preflight、Bearer header、health endpoint 與非白名單 Origin。
