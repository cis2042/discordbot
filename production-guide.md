# Discord 驗證機器人生產環境指南

本指南提供將 Discord 驗證機器人部署到生產環境的詳細步驟。

## 前期準備

### 1. Discord 應用設置

1. 訪問 [Discord 開發者平台](https://discord.com/developers/applications)
2. 創建新應用或選擇現有應用
3. 在 "Bot" 頁面：
   - 啟用所有 Privileged Gateway Intents (Presence, Server Members, Message Content)
   - 複製 Bot Token (`DISCORD_BOT_TOKEN`)
4. 在 "General Information" 頁面：
   - 複製 Application ID (`CLIENT_ID`)
   - 複製 Client Secret (`CLIENT_SECRET`)
5. 在 "OAuth2" > "URL Generator" 頁面：
   - 選擇 `bot` 和 `applications.commands` 範圍
   - 選擇以下機器人權限：
     - Manage Roles
     - Send Messages
     - Embed Links
     - Read Message History
     - Use Slash Commands
   - 複製生成的 URL 並訪問以添加機器人到您的服務器

### 2. Supabase 設置

1. 在 [Supabase](https://supabase.com/) 創建新項目
2. 獲取項目 URL (`SUPABASE_URL`) 和 anon key (`SUPABASE_KEY`)
3. 準備好數據庫後，運行 `npm run supabase:setup` 創建必要的表

### 3. 外部服務設置

1. Google reCAPTCHA：
   - 在 [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) 創建 reCAPTCHA v3 站點
   - 獲取 Site Key 和 Secret Key

2. Twilio (用於 SMS 驗證)：
   - 註冊 [Twilio](https://www.twilio.com/) 帳號
   - 購買電話號碼
   - 獲取 Account SID 和 Auth Token

## 部署步驟

### 1. 服務器準備

確保您的服務器滿足以下要求：
- Node.js >= 16.9.0
- npm >= 7.0.0
- 穩定的網絡連接
- 最低 512MB RAM, 推薦 1GB+

### 2. 項目設置

1. 克隆或上傳項目到服務器：
   ```bash
   git clone https://your-repo-url.git discord-verification-bot
   cd discord-verification-bot
   ```

2. 安裝依賴：
   ```bash
   npm install --production
   ```

3. 配置環境變數 (創建/編輯 `.env` 文件)：
   ```
   # Discord設置
   DISCORD_BOT_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret

   # 數據庫設置
   DATABASE_TYPE=supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key

   # reCAPTCHA設置
   RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

   # Twilio設置
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Web服務設置
   PORT=3000
   BASE_URL=https://your-public-url.com
   
   # 生產模式設置
   USE_MOCK_MODE=false
   NODE_ENV=production
   ```

4. 確保 `BASE_URL` 指向公開可訪問的 URL：
   - 如果使用 IP 地址：`http://your-server-ip:3000`
   - 如果使用域名：`https://your-domain.com`
   - 確保端口已開放或正確轉發

### 3. 部署 Discord 斜線命令

部署所有斜線命令到 Discord：
```bash
node deploy-commands.js
```

### 4. 啟動機器人

#### 方法 A：直接啟動
```bash
npm run production
```

#### 方法 B：使用 PM2 (推薦)
```bash
# 安裝 PM2
npm install -g pm2

# 啟動機器人
pm2 start ecosystem.config.js --env production

# 保存進程列表
pm2 save

# 設置開機自啟 (可能需要 sudo)
pm2 startup
```

#### 方法 C：使用 Docker
```bash
# 構建 Docker 鏡像
docker build -t discord-verification-bot .

# 運行容器
docker run -d --name discord-bot --env-file .env -p 3000:3000 discord-verification-bot
```

## 初始設置

成功部署後，您需要在 Discord 中進行初始設置：

1. 在您的 Discord 服務器中，創建要用於已驗證用戶的角色
2. 使用 `/setup` 命令配置機器人：
   ```
   /setup verified_role:@已驗證角色 require_recaptcha:true require_sms:true
   ```
3. 測試驗證流程：
   ```
   /verify
   ```
4. 檢查機器人發送的驗證鏈接並完成驗證

## 監控與維護

### 日誌監控
- 日誌位於 `logs/` 目錄
- 查看錯誤日誌：`tail -f logs/error.log`
- 查看所有日誌：`tail -f logs/combined.log`

### 故障排除
- 如果機器人無響應：檢查 Discord 令牌是否有效
- 如果斜線命令不顯示：嘗試重新部署命令
- 如果驗證流程失敗：檢查 reCAPTCHA 和 Twilio 設置

### 定期維護
1. 更新依賴：
   ```bash
   npm update
   ```
2. 檢查日誌文件大小並考慮日誌輪轉
3. 監控 Twilio 餘額，確保 SMS 驗證持續可用

## 擴展建議

- 多服務器支持：機器人默認支持多個 Discord 服務器
- 高流量處理：考慮使用負載均衡或增加服務器資源
- 備份：定期備份 Supabase 數據
- 監控：設置服務器資源和可用性監控

## 安全建議

1. 保持所有令牌和密鑰安全，不要在公共場合分享
2. 定期更新 Node.js 和所有依賴
3. 考慮為驗證網頁啟用 HTTPS
4. 設置 IP 限制或防火牆規則保護 Web 服務
5. 監控異常活動並設置警報