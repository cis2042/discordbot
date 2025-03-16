# Discord 驗證機器人部署檢查清單

在將 Discord 驗證機器人部署到生產環境之前，請確保完成以下步驟：

## 1. 環境設置

- [ ] 確保 Node.js 版本 >= 16.9.0
- [ ] 在 `.env` 文件中設置以下環境變數：
  - `DISCORD_BOT_TOKEN` - Discord 機器人令牌
  - `CLIENT_ID` - Discord 應用 ID
  - `CLIENT_SECRET` - Discord 應用密鑰
  - `DATABASE_TYPE=supabase` - 使用 Supabase 作為數據庫
  - `SUPABASE_URL` - Supabase 項目 URL
  - `SUPABASE_KEY` - Supabase 匿名密鑰
  - `RECAPTCHA_SITE_KEY` - Google reCAPTCHA 站點密鑰
  - `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA 密鑰
  - `TWILIO_ACCOUNT_SID` - Twilio 帳號 SID (用於 SMS)
  - `TWILIO_AUTH_TOKEN` - Twilio 認證令牌
  - `TWILIO_PHONE_NUMBER` - Twilio 電話號碼
  - `PORT` - Web 服務端口 (默認 3000)
  - `BASE_URL` - 公網可訪問的基礎 URL
  - `USE_MOCK_MODE=false` - 確保關閉模擬模式

## 2. 數據庫設置

- [ ] Supabase 項目已創建
- [ ] 運行 `npm run supabase:setup` 創建必要的數據庫表
- [ ] 確認表格已創建：
  - `server_configs`
  - `verification_records`

## 3. Discord 設置

- [ ] 在 [Discord 開發者平台](https://discord.com/developers/applications) 創建應用
- [ ] 啟用所有必要的權限：
  - Presence Intent
  - Server Members Intent
  - Message Content Intent
- [ ] 機器人添加到目標 Discord 服務器，並具有以下權限：
  - 管理角色
  - 發送消息
  - 嵌入鏈接
  - 讀取消息歷史
  - 使用斜線命令

## 4. 部署步驟

1. 克隆或下載項目代碼到服務器
2. 安裝依賴：`npm install`
3. 配置 `.env` 文件
4. 部署斜線命令：`node deploy-commands.js`
5. 啟動機器人：`npm run production`

## 5. 測試驗證

- [ ] 使用 `/setup` 在 Discord 服務器中設置驗證參數
- [ ] 測試 `/verify` 命令，確保收到驗證鏈接
- [ ] 確認 reCAPTCHA 驗證正常工作
- [ ] 確認 SMS 驗證（如果啟用）正常工作
- [ ] 確認用戶收到角色分配

## 6. 監控與日誌

- [ ] 檢查 `logs/` 目錄中的日誌文件以監控機器人運行
- [ ] 設置系統監控以確保機器人持續運行

## 7. 持久化運行

- [ ] 考慮使用進程管理器如 PM2 或 systemd 確保機器人持續運行
- [ ] 配置自動重啟，確保在服務器重啟後機器人可以自動啟動

### 使用 PM2 持久化運行

```bash
# 安裝 PM2
npm install -g pm2

# 啟動機器人
pm2 start src/index.js --name "discord-verification-bot" --env production

# 保存 PM2 進程列表
pm2 save

# 設置開機自啟
pm2 startup
```