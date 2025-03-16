// Routes for SMS verification
const express = require('express');
const twilio = require('twilio');
const VerificationRecord = require('../../models/VerificationRecord');
const { generateSMSCode, hashPhoneNumber } = require('../../utils/token');
const logger = require('../../utils/logger');

function smsRoute(client) {
  const router = express.Router();
  
  // Send SMS verification code
  router.post('/send', async (req, res) => {
    try {
      const { phoneNumber, userId, token, countryCode } = req.body;
      
      if (!phoneNumber || !userId || !token) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要參數'
        });
      }
      
      // Check if we're in mock mode
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      logger.info(`SMS send request for user ${userId} (Mock Mode: ${mockMode})`);
      
      // Find verification record
      let verificationRecord;
      try {
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token,
          completedAt: null
        });
        
        if (verificationRecord) {
          logger.info(`Found verification record for SMS send: user ${userId}`);
        } else {
          logger.warn(`No verification record found for SMS send: user ${userId}`);
        }
      } catch (error) {
        logger.error('Database error when sending SMS code:', { error: error.toString() });
        
        if (mockMode) {
          // Use mock data in mock mode
          logger.info('[MOCK] Creating mock verification record for SMS verification');
          verificationRecord = {
            userId,
            token,
            attempts: 0,
            save: async function() {
              this.verificationCode = generateSMSCode();
              this.codeExpiry = new Date(Date.now() + 5 * 60 * 1000);
              this.attempts += 1;
              logger.info(`[MOCK] Saved mock verification record with SMS code: ${this.verificationCode}`);
              return this;
            }
          };
        } else {
          throw error;
        }
      }
      
      if (!verificationRecord && !mockMode) {
        return res.status(400).json({ 
          success: false, 
          message: '無效的驗證記錄'
        });
      }
      
      // In mock mode, create a mock record if none exists
      if (!verificationRecord && mockMode) {
        verificationRecord = {
          userId,
          token,
          attempts: 0,
          save: async function() {
            this.verificationCode = generateSMSCode();
            this.codeExpiry = new Date(Date.now() + 5 * 60 * 1000);
            this.attempts += 1;
            logger.info(`[MOCK] Saved mock verification record with SMS code: ${this.verificationCode}`);
            return this;
          }
        };
      }
      
      // Check if user has exceeded maximum attempts
      if (verificationRecord.attempts >= 3 && !mockMode) {
        return res.status(400).json({ 
          success: false, 
          message: '已超過最大嘗試次數。請重新使用 /verify 命令。'
        });
      }
      
      // Format phone number with country code
      const formattedPhoneNumber = `+${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      
      // Generate and store verification code
      const verificationCode = generateSMSCode();
      const codeExpiry = new Date();
      codeExpiry.setMinutes(codeExpiry.getMinutes() + 5); // 5 minutes expiry
      
      // Update verification record
      if (verificationRecord.save) {
        verificationRecord.verificationCode = verificationCode;
        verificationRecord.codeExpiry = codeExpiry;
        verificationRecord.phoneHash = hashPhoneNumber(formattedPhoneNumber);
        verificationRecord.phoneCountry = countryCode;
        verificationRecord.attempts += 1;
        await verificationRecord.save();
      }
      
      // Use mock mode or real SMS sending
      if (mockMode) {
        logger.info(`[MOCK SMS] To: ${formattedPhoneNumber}, Code: ${verificationCode}`);
        return res.json({ 
          success: true, 
          message: '驗證碼已發送（模擬模式）',
          mockCode: verificationCode // Only in mock mode
        });
      } else {
        // Initialize Twilio client
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        // Send SMS
        try {
          await twilioClient.messages.create({
            body: `您的Discord驗證碼是: ${verificationCode}。此碼5分鐘內有效。`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhoneNumber
          });
          
          logger.info(`SMS verification code sent to ${countryCode}*****${phoneNumber.slice(-4)}`);
          
          return res.json({ 
            success: true, 
            message: '驗證碼已發送到您的手機'
          });
        } catch (twilioError) {
          logger.error('Twilio error:', { 
            error: twilioError.toString(), 
            code: twilioError.code,
            phoneNumber: formattedPhoneNumber
          });
          return res.status(400).json({ 
            success: false, 
            message: '發送簡訊失敗，請檢查您的電話號碼是否正確。'
          });
        }
      }
    } catch (error) {
      logger.error('Error sending SMS verification:', { error: error.toString(), stack: error.stack });
      res.status(500).json({ success: false, message: '發送SMS驗證時出錯' });
    }
  });
  
  // Verify SMS code
  router.post('/verify', async (req, res) => {
    try {
      const { code, userId, token } = req.body;
      
      if (!code || !userId || !token) {
        return res.status(400).json({ 
          success: false, 
          message: '缺少必要參數'
        });
      }
      
      // Check if we're in mock mode
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      logger.info(`SMS verify request for user ${userId} (Mock Mode: ${mockMode})`);
      
      // Find verification record
      let verificationRecord;
      try {
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token,
          completedAt: null
        });
        
        if (verificationRecord) {
          logger.info(`Found verification record for SMS verify: user ${userId}`);
        } else {
          logger.warn(`No verification record found for SMS verify: user ${userId}`);
        }
      } catch (error) {
        logger.error('Database error when verifying SMS code:', { error: error.toString() });
        
        if (mockMode) {
          // Use mock data in mock mode
          logger.info('[MOCK] Creating mock verification record for SMS code verification');
          verificationRecord = {
            userId,
            token,
            verificationCode: code, // Auto-match in mock mode
            codeExpiry: new Date(Date.now() + 5 * 60 * 1000),
            verificationStatus: {
              reCaptcha: true,
              sms: false
            },
            save: async function() {
              this.verificationStatus.sms = true;
              this.verificationCode = null;
              logger.info('[MOCK] Saved mock verification record with SMS verified');
              return this;
            }
          };
        } else {
          throw error;
        }
      }
      
      if (!verificationRecord && !mockMode) {
        return res.status(400).json({ 
          success: false, 
          message: '無效的驗證記錄'
        });
      }
      
      // In mock mode, create a mock record if none exists
      if (!verificationRecord && mockMode) {
        verificationRecord = {
          userId,
          token,
          verificationCode: code, // Auto-match in mock mode
          codeExpiry: new Date(Date.now() + 5 * 60 * 1000),
          verificationStatus: {
            reCaptcha: true,
            sms: false
          },
          save: async function() {
            this.verificationStatus.sms = true;
            this.verificationCode = null;
            logger.info('[MOCK] Saved mock verification record with SMS verified');
            return this;
          }
        };
      }
      
      // Check if code exists and not expired
      if (!mockMode) {
        if (!verificationRecord.verificationCode || !verificationRecord.codeExpiry) {
          return res.status(400).json({ 
            success: false, 
            message: '請先請求驗證碼'
          });
        }
        
        if (verificationRecord.codeExpiry < new Date()) {
          return res.status(400).json({ 
            success: false, 
            message: '驗證碼已過期，請重新獲取'
          });
        }
      }
      
      // Verify code
      if (mockMode || verificationRecord.verificationCode === code) {
        // Mark SMS as verified
        if (verificationRecord.save) {
          verificationRecord.verificationStatus.sms = true;
          verificationRecord.verificationCode = null; // Clear code after successful verification
          await verificationRecord.save();
        }
        
        logger.info(`SMS verification successful for user ${userId}`);
        
        return res.json({ 
          success: true, 
          message: 'SMS驗證成功',
          verificationStatus: verificationRecord.verificationStatus
        });
      } else {
        logger.warn(`SMS verification failed for user ${userId} - incorrect code`);
        
        return res.status(400).json({ 
          success: false, 
          message: '驗證碼不正確'
        });
      }
    } catch (error) {
      logger.error('Error verifying SMS code:', { error: error.toString(), stack: error.stack });
      res.status(500).json({ success: false, message: '驗證SMS代碼時出錯' });
    }
  });
  
  return router;
}

module.exports = { smsRoute };