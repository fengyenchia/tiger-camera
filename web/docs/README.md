# Web 現況與待辦

更新日期：2026-08-24

## 架構

- `web/frontend/` 是瀏覽器 UI；`api/` 是前端呼叫層，不是後端 Route Handler。
- `web/backend/app/api/` 是 HTTP endpoint；`web/backend/lib/server/` 是資料庫、R2 與驗證實作。
- Frontend 與 Backend 分別部署，透過 `NEXT_PUBLIC_API_BASE_URL` 連接。

## 已完成

- Device initiate／complete、短效 R2 PUT、6 位領取碼與 opaque UUID claim token。
- Claim 後由 Backend 代理私人原圖，已排除 R2 GET redirect CORS 問題。
- Canvas 拍立得框、日期、文字、濾鏡與基本影像調整；可全部關閉。
- 完成圖下載、R2 PUT、publish、公開後自動前往相簿。
- 公開相簿與 Dialog overlay 放大。
- Admin Bearer JWT 登入、裝置管理與一次永久刪除。
- Swagger `/api/docs` 與 OpenAPI `/api/openapi`。
- 正式 Frontend／Backend 網域、Neon、R2 及實機端到端功能流程。

## 權限

- 公開訪客：只讀公開相簿。
- Claim holder：`sessionStorage` 保存 UUID token，只能操作一張草稿。
- Admin：依目前需求用 `localStorage` 保存短效 JWT，由 Axios 主動加 `Authorization: Bearer`。
- Device：只保存可撤銷 credential，不保存 R2／Neon／Admin secret。

## 儲存生命週期

- Original：私人暫存；Backend 驗證 Claim 後代理給瀏覽器。
- Processed：手機 Canvas 產生；上傳確認後才可發布。
- 發布／逾期後清除 Original；失敗由 cleanup 重試。
- 管理員刪除是一次永久刪除，沒有垃圾桶或復原。

## 待完成

1. iOS Safari、Android Chrome 的領取、Canvas、下載與公開矩陣。
2. 裝置撤銷、30 次完整上傳、5 次斷線恢復。
3. Cleanup cron 的 Neon／R2 一致性證據與 orphan object 測試。
4. 草稿待傳 IndexedDB／下載 fallback 的發布前決策與測試。
5. 最終 lint、typecheck、tests、production build 與安全檢查。

詳細建置、API 與 Postman 順序見 [`backend-setup.md`](backend-setup.md)。
