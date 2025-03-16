# Discord 機器人設置指南

## 1. 創建 Discord 機器人

1. 訪問 [Discord 開發者平台](https://discord.com/developers/applications)
2. 點擊右上角的 "New Application" 創建一個新應用
3. 輸入應用名稱（將成為您的機器人名稱）
4. 在左側導航中，點擊 "Bot"
5. 點擊 "Add Bot" 按鈕將您的應用轉換為機器人
6. 在機器人設置頁面：
   - 打開 "Presence Intent"
   - 打開 "Server Members Intent"
   - 打開 "Message Content Intent"
   - 這些權限對於機器人運行是必要的
7. 複製 "TOKEN" - 這是您的 `DISCORD_BOT_TOKEN`
8. 回到應用程序的 "General Information" 頁面
9. 複製 "Application ID" - 這是您的 `CLIENT_ID`
10. 複製 "Client Secret" - 這是您的 `CLIENT_SECRET`

## 2. 邀請機器人加入服務器

1. 在應用程序的 "OAuth2" 頁面，點擊 "URL Generator"
2. 在 "SCOPES" 部分，選擇 "bot" 和 "applications.commands"
3. 在 "BOT PERMISSIONS" 部分，選擇：
   - Manage Roles
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
4. 複製生成的 URL，並在瀏覽器中打開
5. 選擇您要添加機器人的服務器
6. 完成授權過程

## 3. 設置 reCAPTCHA

1. 訪問 [Google reCAPTCHA 管理頁面](https://www.google.com/recaptcha/admin)
2. 點擊 "Create" 按鈕
3. 輸入標籤名稱（例如 "Discord Verification Bot"）
4. 選擇 reCAPTCHA v3
5. 添加您的域名（如果您使用本地測試，可以添加 "localhost"）
6. 接受條款並提交
7. 複製 "Site Key" - 這是您的 `RECAPTCHA_SITE_KEY`
8. 複製 "Secret Key" - 這是您的 `RECAPTCHA_SECRET_KEY`

## 4. 設置 Twilio (用於 SMS 驗證)

1. 訪問 [Twilio 官網](https://www.twilio.com/)
2. 註冊或登錄帳號
3. 從 Twilio 儀表板獲取：
   - Account SID - 這是您的 `TWILIO_ACCOUNT_SID`
   - Auth Token - 這是您的 `TWILIO_AUTH_TOKEN`
4. 購買或設置一個電話號碼 - 這是您的 `TWILIO_PHONE_NUMBER`

## 5. 配置機器人

1. 將所有收集到的值填入 `.env` 文件中，替換占位符
2. 確保 `USE_MOCK_MODE=false` 以連接到真實的 Discord 服務器
3. 如果您在本地運行，請確保 `BASE_URL` 設置正確：
   - 對於本地測試，使用 `http://localhost:3000`
   - 對於公網訪問，使用您的公網 IP 或域名

## 6. 啟動機器人


## 7. 在 Discord 中設置驗證

1. 在您的 Discord 服務器中，創建一個角色作為已驗證用戶的角色
2. 使用機器人的 `/setup` 命令配置驗證系統：
   - 選擇已驗證角色
   - 設置是否需要 reCAPTCHA
   - 設置是否需要 SMS
   - 自定義歡迎消息（可選）
   - 設置驗證超時時間（可選）

## 8. 測試驗證流程

1. 使用 `/verify` 命令開始驗證流程
2. 按照機器人發送的私信中的鏈接訪問驗證頁面
3. 完成驗證步驟
4. 使用 `/verification-status` 檢查您的驗證狀態 