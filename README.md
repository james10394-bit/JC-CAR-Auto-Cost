# JC 車型成本工作台 v1.1.1《GitHub Pages・雲端同步版》

GitHub Pages 提供靜態網頁；Supabase 提供帳號登入、私人資料庫與檔案保存。手機與電腦使用同一個帳號可讀取同一份資料，重新載入會讀取最新雲端資料；目前沒有即時多人推播。

## 功能
- 空車／套裝總成本、原廠獎金、車貸佣金、配車額度、庫存與有效期限。
- 上傳 PDF／掃描頁、圖片、Excel／CSV、DOCX、TXT、EML。原始檔保存於私人 bucket。
- 本瀏覽器執行繁中 OCR，欄位規則判讀成待確認草稿，核對後才加入試算。
- 業務毛利及客戶車貸／舊換新試算；未知成本不當作零。
- GitHub repository 子路徑支援，OCR／PDF worker 不依賴網站根目錄。

## 1. 建立雲端後台
1. 在 https://supabase.com/dashboard 建立新的專案。
2. 開啟 SQL Editor，執行 `backend/setup.sql`。
3. Authentication → Users → Add user，建立你自己的信箱與密碼。
4. Authentication 設定關閉公開註冊。網頁沒有開放註冊按鈕。
5. Project Settings／API 取得 Project URL、publishable key（或 anon public key）。**不要提供 service_role、secret key 或帳號密碼到 GitHub。**
6. 資料列以登入者 user ID 隔離，檔案 bucket 是 private，下載需登入。

## 2. GitHub Pages
1. 新建 repo，建議名稱 `JC-CAR-Auto-Cost`。根目錄上傳本包的來源檔，包含 `.github/workflows/pages.yml`（隱藏目錄不可漏）。
2. Settings → Pages → Source 選 GitHub Actions。
3. Settings → Secrets and variables → Actions → Variables，可設定 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。這兩個是公開連線設定，不是管理金鑰。
4. 推送 main，等待 Actions 部署成功。若沒設定 Variables，也可在第一次開啟網站時填公開設定。
5. 登入後上傳資料，確認草稿，再查詢／試算。請用兩個裝置登入同一帳號並核對同步。

GitHub Pages 的網頁可公開瀏覽；車型資料與文件放在私人雲端後台，不放入 repo。私有 repo 不代表 Pages 網頁本身是私有，Pages 可用方案請依 GitHub 帳號方案確認。

## 狀態與限制
- 已完成 GitHub Pages 專用前端、雲端連線程式、登入、SQL 存取規則與部署流程。
- 尚未建立／連接使用者的 Supabase 專案，尚未部署到使用者 GitHub。沒有冒充同步成功。
- 原本 Sites 上的資料不會自動移轉；若已有資料，需要另做匯出／匯入。
- Gmail 自動讀信尚未實作。登入工作台不代表授權讀取 Gmail；目前匯入 EML 或貼上郵件內容。附件另外上傳。
- OCR／規則可能误讀金額與條款，所有結果須確認。PDF 判讀上限 30 頁，單檔上傳 15 MB。

## 開發
Node.js 24：`npm ci --ignore-scripts`，`npm run dev`，`npm run build`。
GitHub Actions 會依 Pages base path 建置。預設本地 build 使用相對路徑，可放任何 repository 目錄。

## 計算
套裝是含空車的總成本。業務毛利＝成交車價＋另收費＋原廠獎金＋佣金－方案成本－業務其他成本。
客戶应付＝成交車價＋另收費－已核准補助－舊車收購折抵＋舊貸待清償。剩餘款本息平均攤還，額外費用現金另付，實際以銀行契約為準。

圖片辨識與 PDF 的 worker、字型及中文模型由 scripts/prepare-assets.mjs 在部署建置時從 npm 套件複製，不需要手動上傳這些二進位檔案。
