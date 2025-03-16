# Supabase 設置指南 - Discord 驗證機器人

本指南將幫助您設置 Supabase 數據庫用於 Discord 驗證機器人。

## 1. 創建 Supabase 項目

1. 訪問 [Supabase 官網](https://supabase.com/) 並登錄或註冊帳號
2. 點擊 "New Project" 創建新項目
3. 輸入項目名稱（例如 "discord-verification-bot"）
4. 設置安全密碼
5. 選擇離您最近的區域
6. 等待項目創建完成（約 1-2 分鐘）

## 2. 獲取 Supabase 連接信息

1. 進入您新創建的 Supabase 項目
2. 在左側導航欄點擊 "Project Settings"（項目設置）
3. 點擊 "API" 標籤
4. 複製 "Project URL" - 這是您的 `SUPABASE_URL`
5. 複製 "anon public" 密鑰 - 這是您的 `SUPABASE_KEY`
6. 將這些信息添加到您的 `.env` 文件中
    ```
    DATABASE_TYPE=supabase
    SUPABASE_URL=https://xxxxx.supabase.co
    SUPABASE_KEY=eyJhbxxxxxxxx
    ```

## 3. 設置數據庫模式

### 方法 1: 使用自動安裝腳本（推薦）

1. 確保您已填寫 `.env` 文件中的 Supabase 連接信息
2. 運行自動設置腳本:
    ```bash
    npm run supabase:setup
    ```
3. 腳本將自動創建必要的表和函數

### 方法 2: 手動設置

1. 進入 Supabase 儀表板
2. 點擊左側導航中的 "SQL Editor"（SQL 編輯器）
3. 點擊 "New Query"（新建查詢）
4. 將 `supabase/migrations/create_discord_verification_tables.sql` 文件的內容複製到編輯器中
5. 點擊 "Run"（運行）執行 SQL

## 4. 配置行級安全策略（Row Level Security）

Supabase 默認啟用行級安全策略。我們的 SQL 腳本已經添加了基本的安全策略，允許經過身份驗證的用戶訪問數據。

在生產環境中，您可能需要根據您的安全需求調整這些策略。

## 5. 測試連接

1. 確保您的 `.env` 文件中設置了 `DATABASE_TYPE=supabase`
2. 啟動機器人:
    ```bash
    npm run production
    ```
3. 觀察控制台日誌，確認 "Connected to Supabase" 訊息出現

## 數據庫結構

### server_configs 表
存儲 Discord 服務器配置信息
- 服務器 ID
- 驗證角色設置
- 驗證要求（reCAPTCHA/SMS）
- 歡迎消息和超時設置

### verification_records 表
存儲用戶驗證記錄
- 用戶 ID 和服務器 ID
- 驗證令牌和狀態
- SMS 驗證碼和過期時間
- 完成時間和 IP 地址

## 故障排除

如果您遇到連接問題:

1. 檢查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 是否正確
2. 確保您的 Supabase 項目處於活動狀態
3. 檢查您的 Supabase 項目的 "Database" 部分，確保狀態為 "Online"
4. 如果使用 IP 限制，確保您的服務器 IP 已被添加到允許列表中

## 數據備份

Supabase 會自動備份您的數據。您也可以:

1. 在 Supabase 儀表板中點擊 "Database" > "Backups"
2. 點擊 "Create a new backup" 手動創建備份
3. 對於重要數據，考慮定期導出數據

## 遷移提示

如果從 MongoDB 遷移到 Supabase:

1. 確保所有現有數據已被遷移
2. 更新 `.env` 文件中的 `DATABASE_TYPE=supabase`
3. 添加 Supabase 連接信息
4. 機器人將自動使用 Supabase 而非 MongoDB

感謝使用 Supabase 與 Discord 驗證機器人！