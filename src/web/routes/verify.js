// Routes for verification page
const express = require('express');
const VerificationRecord = require('../../models/VerificationRecord');
const ServerConfig = require('../../models/ServerConfig');
const logger = require('../../utils/logger');

function verifyRoute(client) {
  const router = express.Router();
  
  // Main verification page
  router.get('/:userId/:token', async (req, res) => {
    try {
      const { userId, token } = req.params;
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      
      logger.info(`Verification page accessed for user ${userId} with token ${token.substring(0, 8)}...`);
      
      // Find verification record
      let verificationRecord;
      try {
        logger.info(`Attempting to find verification record for user ${userId} with token ${token.substring(0, 8)}...`);
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token,
          completedAt: null
        });
        
        if (verificationRecord) {
          logger.info(`Found verification record for user ${userId}`);
        } else {
          logger.warn(`No verification record found for user ${userId} with token ${token.substring(0, 8)}...`);
          
          // 嘗試查找任何與該用戶相關的記錄，不考慮令牌
          logger.info(`Attempting to find any verification record for user ${userId}...`);
          const anyRecord = await VerificationRecord.findOne({
            userId,
            completedAt: null
          });
          
          if (anyRecord) {
            logger.info(`Found a different verification record for user ${userId} with token ${anyRecord.token.substring(0, 8)}...`);
            
            // 檢查是否是舊令牌，如果是新令牌，則使用它
            if (anyRecord.token !== token) {
              // 如果找到的記錄有更新的令牌，則更新當前令牌
              logger.info(`Updating verification record with new token for user ${userId}`);
              anyRecord.token = token;
              await anyRecord.save();
              verificationRecord = anyRecord;
            }
          } else {
            // 如果找不到任何記錄，創建一個新的
            logger.info(`No verification records found for user ${userId}, creating a new one`);
            verificationRecord = await VerificationRecord.create({
              userId,
              token,
              guildId: req.query.guildId || 'unknown-guild',
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
              verificationStatus: {
                reCaptcha: false,
                sms: false
              },
              ipAddress: req.ip
            });
          }
        }
      } catch (error) {
        logger.error('Database error when accessing verification record:', { 
          error: error.toString(),
          stack: error.stack,
          userId,
          token: token.substring(0, 8)
        });
        
        // If in mock mode, use mock data
        if (mockMode) {
          logger.info('[MOCK] Using mock verification record data');
          // Continue with mock data
        } else {
          // 嘗試創建一個臨時記錄
          logger.info(`Creating temporary verification record for user ${userId}`);
          verificationRecord = {
            userId,
            token,
            guildId: req.query.guildId || 'unknown-guild',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            verificationStatus: {
              reCaptcha: false,
              sms: false
            },
            ipAddress: req.ip,
            save: async function() {
              logger.info('[Memory] Saving temporary verification record');
              return this;
            }
          };
        }
      }
      
      if (!verificationRecord && mockMode) {
        // Create mock verification record for testing
        logger.info('[MOCK] Creating mock verification record');
        verificationRecord = {
          userId,
          token,
          guildId: 'mock-guild-id',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          verificationStatus: {
            reCaptcha: false,
            sms: false
          },
          ipAddress: req.ip
        };
      } else if (!verificationRecord) {
        return res.render('error', {
          message: '無效的驗證鏈接',
          details: '此驗證鏈接無效或已過期。請重新使用 /verify 命令獲取新的驗證鏈接。',
          showReturnButton: true
        });
      }
      
      // Check if token is expired
      if (verificationRecord.expiresAt < new Date()) {
        return res.render('error', {
          message: '驗證鏈接已過期',
          details: '此驗證鏈接已過期。請重新使用 /verify 命令獲取新的驗證鏈接。'
        });
      }
      
      // Get server configuration
      let serverConfig;
      try {
        serverConfig = await ServerConfig.findOne({ guildId: verificationRecord.guildId });
        
        if (serverConfig) {
          logger.info(`Found server config for guild ${verificationRecord.guildId}`);
        } else {
          logger.warn(`No server config found for guild ${verificationRecord.guildId}`);
        }
      } catch (error) {
        logger.error('Database error when accessing server config:', { error: error.toString() });
        // If in mock mode, use mock data
        if (mockMode) {
          logger.info('[MOCK] Using mock server configuration');
        } else {
          throw error; // Re-throw for standard error handling
        }
      }
      
      if (!serverConfig && mockMode) {
        // Create mock server config for testing
        logger.info('[MOCK] Creating mock server configuration');
        serverConfig = {
          guildId: verificationRecord.guildId,
          requireRecaptcha: true,
          requireSMS: true
        };
      } else if (!serverConfig) {
        return res.render('error', {
          message: '服務器配置錯誤',
          details: '無法找到服務器的驗證配置。請聯絡服務器管理員。'
        });
      }
      
      // Store IP address if not in mock mode
      if (!mockMode && verificationRecord.save) {
        verificationRecord.ipAddress = req.ip;
        await verificationRecord.save().catch(err => {
          logger.warn('Could not save IP address to verification record:', { error: err.toString() });
        });
      }
      
      // Get guild name (safely)
      let guildName = '未知服務器';
      
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
      
      // Render verification page
      res.render('verify', {
        userId,
        token,
        guildId: verificationRecord.guildId,
        guildName: guildName,
        requireRecaptcha: serverConfig.requireRecaptcha,
        requireSMS: serverConfig.requireSMS,
        verificationStatus: verificationRecord.verificationStatus,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || 'mock-recaptcha-site-key'
      });
    } catch (error) {
      logger.error('Error serving verification page:', { error: error.toString(), stack: error.stack });
      res.render('error', {
        message: '驗證過程出錯',
        details: '處理驗證請求時出現錯誤。請稍後再試或聯絡服務器管理員。'
      });
    }
  });
  
  // Complete verification and assign role
  router.post('/complete', async (req, res) => {
    try {
      const { userId, token, guildId } = req.body;
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      
      logger.info(`Verification completion requested for user ${userId} in guild ${guildId}`);
      
      // Find verification record
      let verificationRecord;
      try {
        verificationRecord = await VerificationRecord.findOne({
          userId,
          token,
          completedAt: null
        });
        
        if (verificationRecord) {
          logger.info(`Found verification record for completion: ${userId}`);
        } else {
          logger.warn(`No verification record found for completion: ${userId}`);
        }
      } catch (error) {
        logger.error('Database error when completing verification:', { error: error.toString() });
        if (mockMode) {
          logger.info('[MOCK] Using mock verification data for completion');
          verificationRecord = {
            userId,
            token,
            guildId,
            verificationStatus: { reCaptcha: true, sms: true },
            completedAt: null,
            save: async function() {
              this.completedAt = new Date();
              logger.info('[MOCK] Saved completion status for verification record');
              return this;
            }
          };
        } else {
          return res.status(500).json({ 
            success: false, 
            message: '數據庫連接錯誤，無法完成驗證。' 
          });
        }
      }
      
      if (!verificationRecord && !mockMode) {
        return res.status(400).json({ success: false, message: '無效的驗證記錄' });
      }
      
      // Check if verification is complete
      let serverConfig;
      try {
        serverConfig = await ServerConfig.findOne({ guildId });
        
        if (serverConfig) {
          logger.info(`Found server config for completion in guild ${guildId}`);
        } else {
          logger.warn(`No server config found for completion in guild ${guildId}`);
        }
      } catch (error) {
        logger.error('Database error when fetching server config:', { error: error.toString() });
        if (mockMode) {
          logger.info('[MOCK] Using mock server config for verification completion');
          serverConfig = {
            requireRecaptcha: true,
            requireSMS: true,
            verifiedRoleId: 'mock-verified-role',
            humanRoleId: 'mock-human-role',
            welcomeMessage: '歡迎加入我們的服務器！你已通過驗證。'
          };
        } else {
          return res.status(500).json({ 
            success: false, 
            message: '數據庫連接錯誤，無法獲取服務器配置。' 
          });
        }
      }
      
      if (!serverConfig && !mockMode) {
        return res.status(400).json({ success: false, message: '無效的服務器配置' });
      }
      
      // Check verification status
      if ((serverConfig.requireRecaptcha && !verificationRecord.verificationStatus.reCaptcha) || 
          (serverConfig.requireSMS && !verificationRecord.verificationStatus.sms)) {
        return res.status(400).json({ 
          success: false, 
          message: '驗證未完成',
          status: verificationRecord.verificationStatus
        });
      }
      
      // Mark verification as complete
      if (verificationRecord.save) {
        verificationRecord.completedAt = new Date();
        await verificationRecord.save().catch(err => {
          logger.warn('Could not update verification record completion status:', { error: err.toString() });
        });
      }
      
      // Assign roles (if not in mock mode and Discord is connected)
      let roleAssignmentSuccess = false;
      
      if (mockMode) {
        logger.info('[MOCK] Simulating role assignment');
        roleAssignmentSuccess = true;
      } else {
        try {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            logger.error(`Could not find guild: ${guildId}`);
            return res.status(400).json({ success: false, message: '無法找到指定的服務器' });
          }
          
          const member = await guild.members.fetch(userId);
          if (!member) {
            logger.error(`Could not find member: ${userId} in guild ${guildId}`);
            return res.status(400).json({ success: false, message: '無法找到服務器成員' });
          }
          
          // Assign verified role
          await member.roles.add(serverConfig.verifiedRoleId);
          logger.info(`Assigned verified role to user ${userId} in guild ${guildId}`);
          
          // Assign human role if SMS verification was required and completed
          if (serverConfig.requireSMS && verificationRecord.verificationStatus.sms && serverConfig.humanRoleId) {
            await member.roles.add(serverConfig.humanRoleId);
            logger.info(`Assigned human role to user ${userId} in guild ${guildId}`);
          }
          
          // Send welcome message
          try {
            await member.send({
              content: serverConfig.welcomeMessage
            });
            logger.info(`Sent welcome message to user ${userId}`);
          } catch (dmError) {
            logger.error('Could not send welcome DM:', { error: dmError.toString() });
          }
          
          roleAssignmentSuccess = true;
        } catch (roleError) {
          logger.error('Error assigning roles:', { error: roleError.toString(), stack: roleError.stack });
          roleAssignmentSuccess = false;
        }
      }
      
      if (roleAssignmentSuccess) {
        return res.json({ 
          success: true, 
          message: '驗證成功！您現在可以訪問服務器。'
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: '驗證成功，但無法分配角色。請聯絡服務器管理員。'
        });
      }
    } catch (error) {
      logger.error('Error completing verification:', { error: error.toString(), stack: error.stack });
      res.status(500).json({ success: false, message: '處理驗證時出錯' });
    }
  });
  
  return router;
}

module.exports = { verifyRoute };