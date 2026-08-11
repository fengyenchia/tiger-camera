# Tiger Camera Web

`tiger-camera.fengyenchia.com` 的 full-stack Next.js 網站。目前完成 Gate C0 的垂直切片：獨立介紹首頁、JPEG 上傳、相簿與單次操作直接刪除。V1 在同一個 `web/` 專案內按責任區分前端與伺服器程式，不另外拆成兩個部署專案。

完整功能用法、API 結構、限制與待做清單請見 [`docs/README.md`](docs/README.md)。

## 開發

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## 目前資料模式

`app/api/photos/route.ts` 是記憶體 demo API，讓 Axios 串接與完整 UI 流程可以先被驗證。它不是永久儲存：開發伺服器重新啟動、重新部署或 Serverless instance 被回收後，新增內容可能消失。

正式 Gate C0 要把 `lib/server/demo-photo-store.ts` 替換成：

1. 管理員 authentication。
2. 私人物件儲存的短效上傳網址。
3. PostgreSQL `photos` metadata。
4. 原圖／後製圖分開上傳與完成確認。
5. 可重試的永久刪除流程。

正式後製會由瀏覽器 Canvas 保留原始 JPEG，另外產生包含復古處理、拍攝日期與拍立得邊框的 processed JPEG。

## Vercel 部署

Git 保留完整 repository，在 Vercel 專案將 **Root Directory** 設為 `web`。不需要另外建立只包含 `web/` 的 Git repository，也不要把根層文件複製進 `web/`。

頁面只透過 `api/common.ts` 的 Axios instance 與 `api/photos.ts` 存取 API；共用型別放在 `api/types.ts`。正式後端不需要改寫畫面元件。

## 設計系統

全域 tokens 位於 `app/globals.css`：

- 色彩：`--primary`、`--secondary`、`--accent`、`--muted`、`--destructive` 等。
- 圓角：`--rounded-primary`、`--rounded-secondary`、`--rounded-small`、`--rounded-pill`。
- 陰影：`--shadow-soft-value`、`--shadow-card-value`、`--shadow-button-value` 等。

Tailwind 4 已映射成 `bg-primary`、`text-muted-foreground`、`rounded-primary`、`shadow-card` 等 class。常用元件放在 `components/ui/`，採 shadcn/ui 的本地原始碼模式；圖示統一使用 `@tabler/icons-react`。

全站字體統一載入 `public/fonts/NotoSansTC-VF.ttf`，一般文字與標題不混用其他字體。

共用 `SiteNavbar` 與 `SiteFooter` 位於 `components/`。Navbar 使用 Motion 的 `useScroll` 與 `useMotionValueEvent`，向下捲動時隱藏、向上回捲一小段時顯示。

ESP32 Flash 內的最小區域取圖頁面屬於 `../firmware/data/`，不與此專案共用 build。
