// Routes for reCAPTCHA verification
const express = require('express');
const axios = require('axios');
const VerificationRecord = require('../../models/VerificationRecord');
const logger = require('../../utils/logger');

function recaptchaRoute(client) {
  const router = express.Router();
  
  // Verify reCAPTCHA response
  router.post('/verify', async (req, res) => {
    try {
      const { recaptchaToken, userId, verificationToken } = req.body;
      
      if (!recaptchaToken) {
        return res.status(400).json({ success: false, message: '缺少reCAPTCHA令牌' });
      }
      
      // Check if we're in mock mode
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      logger.info(`reCAPTCHA verification request for user ${userId} (Mock Mode: ${mockMode})`);
      
      // Find verification record
      let verificationRecord;
      try {
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token: verificationToken,
          completedAt: null
        });
        
        if (verificationRecord) {
          logger.info(`Found verification record for reCAPTCHA verification: user ${userId}`);
        } else {
          logger.warn(`No verification record found for reCAPTCHA verification: user ${userId}`);
        }
      } catch (error) {
        logger.error('Database error when verifying reCAPTCHA:', { error: error.toString() });
        
        if (mockMode) {
          // Use mock data in mock mode
          logger.info('[MOCK] Creating mock verification record for reCAPTCHA verification');
          verificationRecord = {
            userId,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            verificationStatus: {
              reCaptcha: false,
              sms: false
            },
            save: async function() {
              this.verificationStatus.reCaptcha = true;
              logger.info('[MOCK] Saved mock verification record with reCAPTCHA verified');
              return this;
            }
          };
        } else {
          throw error;
        }
      }
      
      if (!verificationRecord && !mockMode) {
        return res.status(400).json({ success: false, message: '無效的驗證記錄' });
      }
      
      // In mock mode, create a mock record if none exists
      if (!verificationRecord && mockMode) {
        verificationRecord = {
          userId,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          verificationStatus: {
            reCaptcha: false,
            sms: false
          },
          save: async function() {
            this.verificationStatus.reCaptcha = true;
            logger.info('[MOCK] Saved mock verification record with reCAPTCHA verified');
            return this;
          }
        };
      }
      
      // Check if the record is expired
      if (verificationRecord.expiresAt < new Date() && !mockMode) {
        return res.status(400).json({ success: false, message: '驗證已過期' });
      }
      
      // Use mock mode or real verification
      let recaptchaSuccess = false;
      
      if (mockMode) {
        logger.info('[MOCK] Using mock mode for reCAPTCHA verification - always succeeds');
        recaptchaSuccess = true;
      } else {
        // Verify with Google reCAPTCHA API
        try {
          const recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
          const recaptchaResponse = await axios.post(
            recaptchaVerifyUrl,
            null,
            {
              params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: recaptchaToken
              }
            }
          );
          
          if (recaptchaResponse.data.success) {
            // For v3, check score
            if (recaptchaResponse.data.score !== undefined) {
              recaptchaSuccess = recaptchaResponse.data.score >= 0.5;
              logger.info(`reCAPTCHA V3 score: ${recaptchaResponse.data.score} (threshold: 0.5)`);
            } else {
              recaptchaSuccess = true;
              logger.info('reCAPTCHA V2 verification successful');
            }
          } else {
            logger.warn('reCAPTCHA verification failed', { 
              errorCodes: recaptchaResponse.data['error-codes'] 
            });
          }
        } catch (error) {
          logger.error('Error calling reCAPTCHA API:', { error: error.toString() });
          return res.status(500).json({ 
            success: false, 
            message: '驗證服務暫時不可用，請稍後再試' 
          });
        }
      }
      
      if (recaptchaSuccess) {
        // Update verification record
        if (verificationRecord.save) {
          verificationRecord.verificationStatus.reCaptcha = true;
          await verificationRecord.save();
        }
        
        logger.info(`reCAPTCHA verification successful for user ${userId}`);
        
        return res.json({ 
          success: true, 
          message: 'reCAPTCHA驗證成功',
          verificationStatus: verificationRecord.verificationStatus
        });
      } else {
        logger.warn(`reCAPTCHA verification failed for user ${userId}`);
        
        return res.status(400).json({ 
          success: false, 
          message: 'reCAPTCHA驗證失敗，請再試一次'
        });
      }
    } catch (error) {
      logger.error('Error verifying reCAPTCHA:', { error: error.toString(), stack: error.stack });
      res.status(500).json({ success: false, message: '驗證reCAPTCHA時出錯' });
    }
  });
  
  return router;
}

module.exports = { recaptchaRoute };