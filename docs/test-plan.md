# Tiger Camera V1 測試計畫

狀態（2026-08-16）：使用者回報 Gate C0 所有 API 已完成開發環境測試。硬體已分別跑通 Camera 與 ST7735，並量得 16 MB Flash／8 MB PSRAM。Gate H1 合併韌體 Serial 為 OV2640 PID `0x26`、tuning applied、GPIO1 idle HIGH／press latched，成功保存 20,174-byte JPEG 後剩餘 8,242,243-byte PSRAM。實機確認 REDTAB／BGR、inversion off、文字與照片方向正確，固定 VGA 後預覽與拍照顏色一致。10 次冷開機與 30 次連拍全部成功，Gate H1 通過。

實機結果要記錄日期、韌體 commit、PCB／sensor／螢幕標示、供電、Wi-Fi／熱點型號、手機／OS／瀏覽器及錯誤 log。未在實體裝置執行的項目不得標示通過。

## 1. Gate C0：雲端私人草稿與權限

| ID | 測試 | 通過條件 |
|---|---|---|
| C-01 | Device credential | 正確 credential 可 initiate；錯誤或 revoked credential 回 401 |
| C-02 | 裝置 idempotency | 同一 device＋`clientRequestId` 重試只建立一筆草稿 |
| C-03 | 原圖 presigned PUT | URL 只允許指定 original key、JPEG、method 與短有效期 |
| C-04 | Complete 前缺物件 | `HeadObject` 失敗時維持 `uploading`，不得產生領取碼 |
| C-05 | Complete 成功 | 原圖確認後改為 `ready`，回傳 6 位配對碼與 24 小時期限；重送可取得同一碼 |
| C-06 | Code UNIQUE | UNIQUE collision 時重新產生；不同 `ready` 草稿不共用同一配對碼 |
| C-07 | 猜碼取捨 | 錯碼回一般錯誤；不測 HMAC、暴力防護或 claim rate limit，猜中可領取是已接受行為 |
| C-08 | 原子領取 | 兩支手機同時輸入同碼，只能一方成功；狀態 `ready → claimed` |
| C-09 | Claim UUID 綁定 | 資料庫 UUID token 只能讀取、處理、發布綁定的 draft ID；不是 JWT |
| C-10 | Claim UUID 隔離 | 不能讀其他草稿、不能呼叫 Admin DELETE 或裝置 API |
| C-11 | 私人讀取 | 無有效 UUID token 不能取得 original；公開列表不顯示草稿 |
| C-12 | 不公開 | 後製與下載完成但不呼叫 publish，照片仍不在公開相簿 |
| C-13 | Publish | processed `HeadObject` 與 metadata 都正確後才 `claimed → active` |
| C-14 | 公開讀取 | 未登入者可列出及讀取 `active`，看不到秘密或 object key |
| C-15 | Admin JWT | localStorage Bearer JWT 只能在管理員 API 使用；過期 401 清除 token |
| C-16 | 永久刪除 | 按一次後 `active → deleting`，刪完成圖 object 並移除 metadata |
| C-17 | 刪除部分失敗 | 保留 `deleting`，UI 不顯示成功，重試不誤刪其他照片 |
| C-18 | 草稿清理 | 逾時 `uploading／ready／claimed` 與孤兒 objects 依政策清除 |
| C-19 | 發布後原圖清理 | `active` 只公開完成圖；暫存 original 刪除成功，失敗可由 cron 重試 |

## 2. Gate H0：單項硬體

| ID | 測試 | 通過條件 |
|---|---|---|
| H-01 | 板型確認 | PCB、ESP32-S3-WROOM-1-N16R8、OV2640 標示與尺寸已記錄 |
| H-02 | USB-C | TTL／OTG 的燒錄、供電與序列埠行為已確認 |
| H-03 | 相機 | Camera 範例連續 10 分鐘無壞圖／重啟 |
| H-04 | ST7735 | 解析度、offset、旋轉、色序與更新穩定 |
| H-05 | Flash／PSRAM | 韌體讀值符合實物，PSRAM 配置成功 |

## 3. Gate H1：拍照核心

**實機結果（2026-08-16）：PASS。** F-01～F-12 已完成核心與顯示驗證；
其中 F-06 冷開機 10 次、F-07 連拍 30 次皆成功。未回報 boot failure、
壞 JPEG、display artifact、PSRAM 持續下降或 reset。

| ID | 測試 | 通過條件 |
|---|---|---|
| F-01 | 短按快門 | 每次只觸發一張，debounce 正確 |
| F-02 | Framebuffer ownership | JPEG 複製後才歸還 framebuffer；無 use-after-free |
| F-03 | PSRAM 替換 | 成功拍攝原子替換；失敗保留上一張有效照片 |
| F-04 | 拍後回看 | 只顯示剛拍照片，不疊加任何隨機文字 |
| F-05 | 無音訊 | 無喇叭、放大器或虎叫相關 GPIO／程式 |
| F-06 | 冷開機 | 10 次無 boot failure、花屏或錯誤腳位狀態 |
| F-07 | 連拍 | 30 次拍攝無壞 JPEG、display artifact 或 reset |
| F-08 | 快門診斷 | 啟動時 Serial 為 `GPIO1 idle=HIGH`；每次按下都有一筆 `press latched`，BOOT／GPIO0 不視為快門 |
| F-09 | 曝光與色彩 | 在相同室內光源比較相機原始 JPEG 與 TFT；原圖曝光／白平衡可接受，TFT 不應明顯偏灰或錯色 |
| F-10 | 直式一致構圖 | 文字維持已確認方向；VGA 預覽與回看皆保留 JPEG 原方向，中央裁為 4:5 後等比例填滿 128 × 160，不以順／逆時針互換造成 180°跳轉 |
| F-11 | 清晰度來源 | 分別檢查 TFT 與原始 VGA JPEG；移除鏡頭保護膜並確認焦點後，才能判定是否需要調整鏡頭，而非以低解析 TFT 單獨判定 |
| F-12 | 色彩來源 | BLACKTAB 實測為藍綠紅白，改用 REDTAB 後開機色條應鮮明且由左至右為紅、綠、藍、白；色條正確而相機偏色才調 sensor／AWB |

## 4. Gate L0：手機熱點與裝置上傳

| ID | 測試 | 通過條件 |
|---|---|---|
| N-01 | 2.4 GHz 相容 | 目標 iPhone／Android 熱點與家用 Wi-Fi 均至少一種可連 |
| N-02 | 開機重連 | 熱點已開時自動連線；未開時不阻止拍照 |
| N-03 | 省電斷線 | 熱點中斷顯示等待網路，不重啟相機核心 |
| N-04 | 恢復重試 | 網路恢復後以同一 `clientRequestId` 上傳，不建立重複草稿 |
| N-05 | PUT 中拍照 | mutex 保護 buffer；不傳截斷 JPEG，不釋放正在上傳的記憶體 |
| N-06 | 最新照片覆蓋 | 下一次成功拍攝直接取代上一張裝置 JPEG，不需確認；進行中的讀取受 mutex 保護 |
| N-07 | 顯示領取碼 | complete 成功前絕不顯示 code；成功後大字清楚、期限正確 |
| N-08 | Device 撤銷 | Server 撤銷後裝置停止上傳並顯示可辨識錯誤 |
| N-09 | Secrets | 韌體 binary／serial log／Git 沒有 Admin、R2、Neon secrets |

## 5. Gate W0：領取與 Canvas

| ID | 測試 | 通過條件 |
|---|---|---|
| W-01 | NFC | NTAG213 開啟 `https://tiger-camera.fengyenchia.com/create` |
| W-02 | Code 輸入 | 大小寫、前後空白、錯碼、過期與已使用提示清楚 |
| W-03 | 私人原圖 | 領取成功後只有該手機 token 能暫時讀取；原始 Blob 只留在頁面記憶體且離頁釋放 |
| W-04 | 四項獨立 | 框、拍攝時間、文字、濾鏡各自開啟只產生所選效果；時間取自照片 metadata，沒有日期選擇器 |
| W-05 | 組合與全關 | 複合圖層順序正確；全部關閉不做無意義重壓縮 |
| W-06 | 文字模式 | 自訂、五句預設、無文字與 `resolvedText` 一致 |
| W-07 | 圖片方向 | landscape、portrait、low-light 與大圖輸出正確 |
| W-08 | 下載 | 只提供完成圖下載，不提供原圖下載；下載不觸發 publish |
| W-09 | 公開選項 | 預設不公開；明確勾選才上傳 processed 並 publish |
| W-10 | Claim expiry | UUID token 到期後提示重新拍照／取得新碼，不誤用 Admin 登入 |

## 6. NFC 與瀏覽器矩陣

| 平台 | 必測內容 |
|---|---|
| iPhone Safari | NFC 通知、`/create`、領取碼鍵盤、Canvas、下載位置、公開與 token 到期 |
| Android Chrome | NFC 通知、`/create`、領取碼鍵盤、Canvas、下載位置、公開與 token 到期 |
| Windows／macOS Chrome | 手動開 `/create`、claim、Canvas、公開相簿與管理員刪除 |

NFC 只開固定網址，不會自動輸入領取碼；相機螢幕必須提供可手動辨識的 code。V1 不使用 QR Code。

## 7. 壓力與恢復

### S-01：拍照核心

預覽→拍照→PSRAM→回看，重複 100 次。無記憶體洩漏、壞圖、花屏或 reset。

### S-02：熱點中斷

連續 30 次裝置草稿上傳，刻意中斷熱點 5 次。所有成功 draft 僅一個 original object；失敗可識別與重試。

### S-03：領取競爭

對同一 code 發出 20 個並行 claim。只有一個成功，其餘得到一致失敗且不洩漏草稿資料。

### S-04：發布與刪除

連續發布與刪除 30 組；每筆 active 照片只剩一個完成圖 object 與 metadata，暫存原圖及刪除後資料都不形成孤兒。

## 8. 展示前清單

- [ ] NFC 寫入 `https://tiger-camera.fengyenchia.com/create`
- [ ] 熱點名稱／密碼只在不進 Git 的設定中
- [ ] ESP32 螢幕能顯示上傳中、等待網路、領取碼與到期
- [ ] iPhone 與 Android 實機完成「拍照→領取碼→NFC→後製→下載／公開」
- [ ] 公開訪客、claim holder、device、admin 權限隔離已測試
- [ ] 發布後暫存原圖已清理，完成圖永久保存，管理員一次永久刪除與失敗重試已測試
- [ ] 草稿逾時清理與熱點斷線重試已測試
- [ ] Git、前端 bundle、韌體與 logs 沒有秘密或長期雲端 credentials
- [ ] 100 次拍照與 30 次裝置上傳無 brownout、重啟或異常發熱
- [ ] microSD 與 GIF 清楚標示為未來功能
