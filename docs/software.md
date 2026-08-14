# 軟體、NFC、領取碼、後製與雲端相簿規劃

## 1. V1 架構

```mermaid
flowchart LR
    A[快門與 OV2640] --> B[ESP32-S3-CAM]
    B --> C[PSRAM 最新 JPEG]
    B --> D[ST7735 預覽與狀態]
    C --> E[手機熱點或可信任 Wi-Fi]
    E --> F[裝置 API 建立私人草稿]
    F --> G[R2 私人原圖]
    F --> H[Neon draft metadata]
    H --> I[相機螢幕顯示領取碼]
    N[被動 NFC 固定 /create] --> J[使用者手機]
    I --> J
    J --> K[領取私人原圖]
    K --> L[Canvas 後製與下載]
    L --> M{選擇公開?}
    M -->|否| O[維持私人並逾時清理]
    M -->|是| P[上傳後製圖並 publish]
    P --> Q[公開相簿]
```

- ESP32-S3-CAM：拍攝、PSRAM 最新 JPEG、螢幕、Wi-Fi station、私人草稿上傳與重試。
- NFC：被動貼紙固定保存 `https://tiger-camera.fengyenchia.com/create`，不保存領取碼或秘密。
- 使用者手機：輸入領取碼、取得該張私人照片、Canvas 後製、下載及選擇是否公開。
- Next.js：裝置驗證、領取碼交換、claim token、相簿、管理員驗證與 API。
- Cloudflare R2：私人 original／processed objects。
- Neon：裝置、照片狀態、領取碼雜湊、期限與後製 metadata。

## 2. 網路與憑證

### ESP32 Wi-Fi

- V1 不建立相機 AP、Captive Portal、mDNS 或 `192.168.4.1` 區域網站。
- 相機連接預先設定的 2.4 GHz 手機熱點或可信任 Wi-Fi。
- SSID、密碼與 device credential 放在不進 Git 的韌體 secrets／NVS。
- 手機熱點中斷是正常錯誤：拍照與螢幕回看仍可用，網路恢復後重試最新未同步 JPEG。
- 因 V1 沒有 microSD，只能可靠保留最新一張未同步照片；拍下一張前必須警告會取代尚未上傳的照片。

### 三種權限

| 憑證 | 持有者 | 能做什麼 | 不能做什麼 |
|---|---|---|---|
| Device credential | ESP32 | 建立私人草稿、上傳原圖、完成裝置上傳 | 讀取其他照片、發布、刪除、取得管理員權限 |
| Claim token | 輸入正確領取碼的使用者 | 讀取、後製、下載及發布該張照片 | 操作其他草稿、管理裝置、永久刪除 |
| Admin JWT | 唯一管理員 | 刪除照片、管理草稿與裝置 | 不放入 ESP32 或公開頁面 |

Device credential 必須可由管理員撤銷。它可以是高熵 opaque token，Server 只保存 hash；不要把 R2、Neon 或管理員密鑰放入韌體。

## 3. 韌體模組

| 模組 | 責任 |
|---|---|
| `CameraService` | 初始化、預覽幀、拍攝 JPEG |
| `LatestPhotoBuffer` | 在 PSRAM 持有最新 JPEG、替換與 mutex 保護 |
| `DisplayService` | 預覽、回看、隨機文字、上傳與領取碼狀態 |
| `ButtonService` | debounce 與短按 |
| `NetworkService` | Wi-Fi station、自動重連、連線狀態 |
| `DraftUploadService` | device initiate、R2 PUT、complete、重試與 idempotency |
| `DeviceCredentialStore` | 從 NVS 讀取 device ID／credential，不寫入 log |
| `CaptureFeedback` | 五句文字、避免連續重複與回看疊字 |
| `AppState` | 狀態機與跨模組事件 |

## 4. 裝置狀態機

| 狀態 | 畫面 | 允許操作 |
|---|---|---|
| `BOOTING` | Logo／初始化 | 無 |
| `CONNECTING` | 連線中 | 仍可進入預覽 |
| `LIVE_VIEW` | 即時預覽＋網路圖示 | 短按拍照 |
| `CAPTURING` | 凍結／快門動畫 | 忽略重複按鍵 |
| `COPYING` | 複製 JPEG 至 PSRAM | 不更新全畫面 |
| `REVIEW` | 剛拍照片＋隨機文字 | 等待上傳 |
| `UPLOAD_PENDING` | 等待網路／可重試 | 保留最新照片；覆蓋前警告 |
| `UPLOADING` | 上傳中 | 不顯示領取碼 |
| `CLAIM_READY` | 已上傳＋領取碼＋有效時間 | 可回預覽 |
| `ERROR` | 錯誤碼與處置 | 重試／重開 |

只有 Server `complete` 確認原圖 object 存在後，裝置才能顯示領取碼。畫面空間不足時至少顯示大字領取碼、剩餘分鐘與 `已上傳` 狀態，不做 QR Code。

## 5. 最新 JPEG buffer

1. `esp_camera_fb_get()` 取得 JPEG。
2. 在 PSRAM 配置自有 buffer 並複製完整內容。
3. 立刻 `esp_camera_fb_return(fb)`，不得持有已歸還的 framebuffer pointer。
4. 使用 mutex 原子替換 `latestJpeg`、長度與同步狀態。
5. R2 PUT 期間禁止釋放正在傳送的 buffer。
6. 上傳成功後仍可保留到下一次成功拍攝；斷電後消失。

若配置、拍攝或上傳失敗，保留上一張有效照片並顯示錯誤，不得產生領取碼。

## 6. NFC 與領取碼

NFC Tools 寫入：

```text
https://tiger-camera.fengyenchia.com/create
```

NFC 是固定入口。每張照片的領取碼由 Server 產生並顯示於 ST7735，不改寫被動 NFC。

領取碼規則：

- 6～8 位大寫英數字，排除 `0/O`、`1/I` 等易混淆字元。
- 使用密碼學安全亂數；不能由時間、photo ID 或流水號推導。
- Server 只保存 HMAC／hash，不保存可直接讀取的明碼。
- 建議 30 分鐘內有效，成功交換 claim token 後立即失效。
- `/api/drafts/claim` 依 IP、code 與裝置指紋做速率限制。
- Claim token 建議 30～60 分鐘有效，只能操作同一個 draft ID。
- 未領取草稿建議 24 小時後自動移除 original object 與 metadata。

## 7. 手機後製

1. 掃 NFC 開啟 `/create`。
2. 輸入螢幕上的領取碼。
3. `POST /api/drafts/claim` 成功後取得短效 claim token 與私人原圖讀取能力。
4. 原圖保留為 `originalBlob`，不得因後製而覆寫。
5. 使用者獨立複選拍立得框、時間戳記、文字與復古濾鏡，或全部關閉。
6. 文字模式為 `custom`、`default` 或 `none`；保存實際畫出的 `resolvedText`。
7. 有效果時以 Canvas 產生 `processedBlob`；全部關閉時沿用原圖 bytes，仍使用不同 object key。
8. 使用者可以只下載，不公開；下載不呼叫 publish API。
9. 選擇公開時，以 claim token 取得 processed presigned PUT URL，完成後呼叫 publish。

Claim token 適合放在記憶體或 `sessionStorage`，不要當成長期登入憑證。清除瀏覽資料可能讓尚未完成的後製狀態消失，因此頁面始終提供下載。

## 8. API 合約

| Method | Path | 驗證 | 責任 |
|---|---|---|---|
| `POST` | `/api/device/drafts/initiate` | Device credential | 建立 `uploading` 草稿與 original presigned PUT URL |
| `PUT` | R2 presigned URL | URL 短效簽名 | ESP32 直接上傳 original JPEG |
| `POST` | `/api/device/drafts/:id/complete` | Device credential | `HeadObject` 驗證原圖、改為 `ready`、回傳領取碼 |
| `POST` | `/api/drafts/claim` | Claim code＋rate limit | 消耗領取碼、改為 `claimed`、回傳 photo-scoped claim token |
| `GET` | `/api/drafts/:id/image` | Claim token | 取得該草稿私人原圖短效讀取 URL |
| `POST` | `/api/drafts/:id/process/initiate` | Claim token | 取得 processed presigned PUT URL |
| `POST` | `/api/drafts/:id/publish` | Claim token | 驗證 processed object 與 metadata，改為 `active` |
| `GET` | `/api/photos` | 公開 | 分頁列出 `active` 照片 |
| `GET` | `/api/photos/:id/image` | 公開 | 讀取 active original／processed 圖片 |
| `DELETE` | `/api/photos/:id` | Admin JWT | 單次操作永久刪除兩個 objects 與 metadata |

### 裝置上傳順序

1. 韌體為一次拍攝產生穩定的 `clientRequestId`。
2. `device initiate` 驗證 device credential、JPEG MIME／大小並建立 `uploading`。
3. Server 決定 `photos/{photoId}/original.jpg`，回傳五分鐘 presigned PUT URL。
4. ESP32 PUT 原圖後呼叫 `device complete`。
5. Server 以 `HeadObject` 確認物件後建立短效領取碼 hash，將狀態改為 `ready`，只在 response 回傳一次明碼。
6. 相同 `clientRequestId` 重試必須回到同一筆草稿，不建立重複照片。

### 領取與發布順序

1. `/api/drafts/claim` 將輸入正規化後與 hash 比對，檢查期限、狀態與 rate limit。
2. 成功後以 transaction 將 `ready` 改為 `claimed`，使 code 無法再次使用。
3. Server 回傳短效 claim token；token 包含 `draftId`、`scope`、`exp`、issuer 與 audience。
4. 領取者處理圖片；只有選擇公開時才上傳 processed object。
5. `publish` 以 `HeadObject` 驗證 processed object 與 metadata，再把狀態改為 `active`。

## 9. 資料模型

### `devices`

| 欄位 | 用途 |
|---|---|
| `id` | 裝置 UUID |
| `name` | 管理員辨識名稱 |
| `credentialHash` | device credential hash |
| `status` | `active`／`revoked` |
| `createdAt`／`lastSeenAt` | 建立與最近連線時間 |

### `photos`

| 欄位 | 用途 |
|---|---|
| `id`／`deviceId` | 照片 UUID 與建立裝置 |
| `clientRequestId` | 裝置重試 idempotency key |
| `originalKey`／`processedKey` | 私人 R2 object keys；processed 在發布前可為 null |
| `status` | `uploading`、`ready`、`claimed`、`active`、`deleting` |
| `claimCodeHash`／`claimExpiresAt` | 領取碼 hash 與期限 |
| `claimedAt`／`publishedAt` | 領取與發布時間 |
| `capturedAt`／`createdAt` | 拍攝與資料建立時間 |
| `frameEnabled`／`timestampEnabled` | 後製選項 |
| `textMode`／`resolvedText` | 文字模式與實際內容 |
| `filterPreset`／`processingVersion` | 濾鏡與配方版本 |
| `width`／`height`／大小／MIME | 驗證與顯示 metadata |

## 10. 安全規則

- 不把 device credential、claim token、Admin JWT、R2／Neon secrets 寫入 log、公開 Git 或錯誤 response。
- Admin JWT 仍採使用者指定的 localStorage＋Axios Bearer 模式；維持嚴格 CSP、禁止不可信 HTML，`401` 時清除 token。
- Claim token 與 Admin JWT 使用不同 audience／scope，不可互相替代。
- Server 不信任 client 提供的 object key、照片狀態、角色、大小或完成結果。
- Claim code 錯誤 response 不透露「不存在」或「已用掉」的精確差異，避免枚舉。
- 公開 API 只回傳 `active` 照片；`uploading／ready／claimed` 一律不可列出。
- 永久刪除依序 `active → deleting → 刪 R2 → 確認不存在 → 刪 metadata`，部分失敗可安全重試。

## 11. Repo 實作目錄

```text
firmware/
├── platformio.ini
├── include/
├── src/                 # camera、display、network、draft upload
└── test/

web/
├── frontend/
│   ├── api/             # browser Axios: drafts、photos、auth
│   ├── app/             # home、create、gallery；不含 Route Handlers
│   ├── components/
│   ├── lib/photo-processing/
│   └── public/
├── backend/
│   ├── app/api/device/  # device credential endpoints
│   ├── app/api/drafts/  # claim、private read、process、publish
│   ├── app/api/photos/  # public gallery、admin delete
│   ├── lib/server/      # auth、device auth、claim、Neon、R2
│   └── proxy.ts         # API CORS allowlist／preflight
└── docs/
```

## 12. 實作參考

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Cloudflare R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [Neon Serverless Driver](https://neon.com/docs/serverless/serverless-driver)
