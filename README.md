# Discord 驗證機器人

一個功能強大的Discord驗證機器人，支持reCAPTCHA和SMS驗證，幫助服務器管理員防止機器人和垃圾郵件。

## 功能特點

- **多種驗證方式**：支持Google reCAPTCHA和SMS短信驗證
- **自定義設置**：服務器管理員可以自定義驗證要求和角色
- **用戶友好**：簡單的用戶界面和明確的指導
- **安全可靠**：使用安全的令牌和數據庫存儲

## 安裝與設置

### 前提條件

- Node.js 16.x 或更高版本
- Discord機器人令牌
- Supabase賬戶（或其他支持的數據庫）
- reCAPTCHA站點密鑰（可選）
- Twilio賬戶（可選，用於SMS驗證）

### 安裝步驟

1. 克隆倉庫：
   ```
   git clone https://github.com/yourusername/discord-verification-bot.git
   cd discord-verification-bot
   ```

2. 安裝依賴：
   ```
   npm install
   ```

3. 配置環境變量：
   - 複製`.env.example`為`.env`
   - 填寫所有必要的環境變量

4. 啟動機器人：
   ```
   npm run production
   ```

## 使用方法

### 管理員命令

- `/setup` - 設置驗證系統
- `/verification-status` - 檢查驗證狀態
- `/diagnostics` - 運行系統診斷

### 用戶命令

- `/verify` - 開始驗證過程

## 部署

本機器人可以部署在多種平台上：

- 本地服務器
- Netlify（驗證網頁）
- Google Cloud Platform
- Heroku
- Railway

## 貢獻

歡迎提交問題和拉取請求！

## 許可證

MIT 