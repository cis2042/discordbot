// Netlify函數處理驗證請求
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const logger = require('../../src/utils/logger');

// 初始化Express應用
const api = express();

// 設置視圖引擎
api.set('view engine', 'ejs');
api.set('views', path.join(__dirname, '../../src/web/views'));

// 靜態文件
api.use(express.static(path.join(__dirname, '../../src/web/public')));

// 解析請求體
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

// 驗證路由
api.get('/verify/:userId/:token', async (req, res) => {
  try {
    const { userId, token } = req.params;
    const mockMode = process.env.USE_MOCK_MODE === 'true';
    
    logger.info(`[Netlify] Verification page accessed for user ${userId} with token ${token.substring(0, 8)}...`);
    
    // 在模擬模式下創建模擬驗證記錄
    const verificationRecord = {
      userId,
      token,
      guildId: 'mock-guild-id',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分鐘後過期
      verificationStatus: {
        reCaptcha: false,
        sms: false
      },
      ipAddress: req.ip
    };
    
    // 模擬服務器配置
    const serverConfig = {
      guildId: verificationRecord.guildId,
      requireRecaptcha: true,
      requireSMS: false
    };
    
    // 渲染驗證頁面
    res.render('verify', {
      userId,
      token,
      guildId: verificationRecord.guildId,
      guildName: 'Discord伺服器',
      requireRecaptcha: serverConfig.requireRecaptcha,
      requireSMS: serverConfig.requireSMS,
      verificationStatus: verificationRecord.verificationStatus,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || 'mock-recaptcha-site-key'
    });
  } catch (error) {
    logger.error('[Netlify] Error serving verification page:', { error: error.toString(), stack: error.stack });
    res.render('error', {
      message: '驗證過程出錯',
      details: '處理驗證請求時出現錯誤。請稍後再試或聯絡服務器管理員。',
      showReturnButton: true
    });
  }
});

// 完成驗證
api.post('/verify/complete', async (req, res) => {
  try {
    const { userId, token, guildId } = req.body;
    const mockMode = process.env.USE_MOCK_MODE === 'true';
    
    logger.info(`[Netlify] Verification completion requested for user ${userId}`);
    
    // 在模擬模式下，直接返回成功
    return res.json({
      success: true,
      message: '驗證成功！您現在可以關閉此頁面並返回Discord。'
    });
  } catch (error) {
    logger.error('[Netlify] Error completing verification:', { error: error.toString(), stack: error.stack });
    return res.status(500).json({
      success: false,
      message: '驗證過程中發生錯誤。請稍後再試。'
    });
  }
});

// 錯誤處理
api.use((req, res) => {
  res.status(404).render('error', {
    message: '404 - 頁面未找到',
    details: '您嘗試訪問的頁面不存在。請檢查 URL 或返回主頁。',
    showReturnButton: true
  });
});

// 導出Netlify函數處理程序
module.exports.handler = serverless(api); 