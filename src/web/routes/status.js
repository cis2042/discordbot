// Routes for checking verification status
const express = require('express');
const VerificationRecord = require('../../models/VerificationRecord');
const ServerConfig = require('../../models/ServerConfig');
const logger = require('../../utils/logger');

function statusRoute(client) {
  const router = express.Router();
  
  // Get verification status
  router.get('/:userId/:token', async (req, res) => {
    try {
      const { userId, token } = req.params;
      
      // Check if we're in mock mode
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      
      // Find verification record
      let verificationRecord;
      try {
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token
        }).catch(err => {
          logger.warn('Database error when checking verification status:', {
            error: err.message,
            userId
          });
          return null;
        });
      } catch (error) {
        logger.error('Error fetching verification record:', { error: error.toString() });
        
        if (mockMode) {
          logger.info('[MOCK] Using mock verification record for status check');
        } else {
          throw error;
        }
      }
      
      if (!verificationRecord && mockMode) {
        // If in mock mode, return mock data
        logger.info('[MOCK] Returning mock verification status');
        return res.json({
          success: true,
          userId: userId,
          guildId: 'mock-guild-id',
          guildName: 'Mock Discord Server',
          status: {
            reCaptcha: false,
            sms: false
          },
          isExpired: false,
          isCompleted: false,
          createdAt: new Date(),
          requirements: {
            requireRecaptcha: true,
            requireSMS: true
          }
        });
      } else if (!verificationRecord) {
        return res.status(404).json({ 
          success: false, 
          message: '無效的驗證記錄' 
        });
      }
      
      // Check if verification expired
      const isExpired = verificationRecord.expiresAt < new Date();
      
      // Get server config
      let serverConfig;
      try {
        serverConfig = await ServerConfig.findOne({ 
          guildId: verificationRecord.guildId 
        }).catch(error => {
          logger.warn('Error fetching server config:', { error: error.toString() });
          return null;
        });
      } catch (error) {
        logger.error('Error fetching server config:', { error: error.toString() });
        
        if (mockMode) {
          logger.info('[MOCK] Using mock server configuration for status check');
          serverConfig = {
            requireRecaptcha: true,
            requireSMS: true
          };
        } else {
          throw error;
        }
      }
      
      // Get guild information
      let guildName = '未知服務器';
      try {
        if (client.guilds?.cache?.get) {
          const guild = client.guilds.cache.get(verificationRecord.guildId);
          if (guild) {
            guildName = guild.name;
          } else if (mockMode) {
            guildName = 'Mock Discord Server';
          }
        } else if (mockMode) {
          guildName = 'Mock Discord Server';
        }
      } catch (error) {
        logger.warn('Error getting guild information:', { error: error.toString() });
        if (mockMode) {
          guildName = 'Mock Discord Server';
        }
      }
      
      // Format response
      const response = {
        success: true,
        userId: verificationRecord.userId,
        guildId: verificationRecord.guildId,
        guildName: guildName,
        status: verificationRecord.verificationStatus,
        isExpired,
        isCompleted: !!verificationRecord.completedAt,
        completedAt: verificationRecord.completedAt,
        createdAt: verificationRecord.createdAt,
        requirements: {
          requireRecaptcha: serverConfig?.requireRecaptcha || false,
          requireSMS: serverConfig?.requireSMS || false
        }
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error checking verification status:', { error: error.toString(), stack: error.stack });
      res.status(500).json({ success: false, message: '檢查驗證狀態時出錯' });
    }
  });
  
  return router;
}

module.exports = { statusRoute };