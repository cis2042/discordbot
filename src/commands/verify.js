// Command to start the verification process
const { SlashCommandBuilder } = require('discord.js');
const { generateVerificationToken } = require('../utils/token');
const VerificationRecord = require('../models/VerificationRecord');
const ServerConfig = require('../models/ServerConfig');
const logger = require('../utils/logger');

// 定义不同的验证模型
const verificationModels = {
  // 内存模型 - 用于数据库不可用时
  memory: {
    async findConfig(guildId) {
      return {
        guildId,
        verifiedRoleId: null,
        requireRecaptcha: false,
        requireSMS: false,
        settings: {
          verificationTimeout: 30,
          maxAttempts: 3,
          deleteMessagesAfterVerification: true
        }
      };
    },
    async createRecord(data) {
      return {
        ...data,
        save: async () => data
      };
    },
    async updateRecord(record, data) {
      return {
        ...record,
        ...data,
        save: async () => ({ ...record, ...data })
      };
    }
  },
  
  // Supabase 模型 - 主要数据库模型
  supabase: {
    async findConfig(guildId) {
      return await ServerConfig.findOne({ guildId });
    },
    async createRecord(data) {
      return await VerificationRecord.create(data);
    },
    async updateRecord(record, data) {
      if (record.save) {
        Object.assign(record, data);
        return await record.save();
      }
      return record;
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('開始驗證過程'),
    
  async execute(interaction) {
    logger.info(`Verify command triggered by ${interaction.user.tag} in ${interaction.guild ? interaction.guild.name : 'DM'}`);
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const userId = interaction.user.id;
      // 檢查是否在伺服器中執行命令
      if (!interaction.guild) {
        logger.warn(`User ${interaction.user.tag} attempted to use verify command in DMs`);
        return await interaction.editReply({
          content: '❌ 此命令只能在Discord伺服器中使用。請在伺服器中使用此命令。',
          ephemeral: true
        });
      }
      
      const guildId = interaction.guild.id;
      
      // 选择验证模型
      let model = verificationModels.supabase;
      let modelName = 'supabase';
      
      // 检查服务器配置
      let serverConfig;
      try {
        logger.info(`[${modelName}] Attempting to find server config for guild ${guildId}`);
        serverConfig = await model.findConfig(guildId);
        
        // 记录原始配置数据
        logger.info(`[${modelName}] Raw server config:`, serverConfig);
        
        // 检查配置是否有效
        const isValidConfig = serverConfig && (
          // 检查基本属性
          typeof serverConfig === 'object' &&
          serverConfig.guildId === guildId &&
          // 检查必要的配置项
          (serverConfig.verifiedRoleId || serverConfig.humanRoleId) &&
          // 检查验证设置
          typeof serverConfig.requireRecaptcha === 'boolean' &&
          typeof serverConfig.requireSMS === 'boolean'
        );
        
        logger.info(`[${modelName}] Config validation result:`, {
          isValid: isValidConfig,
          hasConfig: !!serverConfig,
          configType: serverConfig ? typeof serverConfig : 'undefined',
          guildIdMatch: serverConfig?.guildId === guildId,
          hasRoles: !!(serverConfig?.verifiedRoleId || serverConfig?.humanRoleId),
          hasSettings: !!(serverConfig?.settings)
        });
        
        if (!isValidConfig) {
          // 配置无效，尝试直接从数据库获取
          logger.warn(`[${modelName}] Invalid config, trying direct database access`);
          const directConfig = await ServerConfig.findOne({ guildId });
          
          if (directConfig) {
            logger.info('Found valid config directly:', directConfig);
            serverConfig = directConfig;
          } else {
            serverConfig = null;
          }
        }
      } catch (error) {
        logger.error(`[${modelName}] Error when checking server config:`, { 
          error: error.toString(),
          stack: error.stack 
        });
        
        // 尝试直接从数据库获取
        try {
          logger.info('Attempting direct database access');
          const directConfig = await ServerConfig.findOne({ guildId });
          
          if (directConfig) {
            logger.info('Successfully retrieved config directly:', directConfig);
            serverConfig = directConfig;
          } else {
            logger.warn('No config found in direct database access');
            serverConfig = null;
          }
        } catch (directError) {
          logger.error('Direct database access failed:', directError);
          serverConfig = null;
        }
      }
      
      // 如果没有找到有效配置，返回错误消息
      if (!serverConfig) {
        logger.warn(`No valid server config found for guild ${guildId}`);
        return await interaction.editReply({
          content: '❌ 此服務器尚未設置驗證系統。請聯絡管理員使用 `/setup` 命令進行設置。',
          ephemeral: true
        });
      }
      
      // 记录最终使用的配置
      logger.info('Using server config:', {
        guildId: serverConfig.guildId,
        verifiedRoleId: serverConfig.verifiedRoleId,
        humanRoleId: serverConfig.humanRoleId,
        requireRecaptcha: serverConfig.requireRecaptcha,
        requireSMS: serverConfig.requireSMS,
        settings: serverConfig.settings
      });
      
      // 检查用户是否已验证
      try {
        const member = await interaction.guild.members.fetch(userId);
        
        // 记录用户的角色信息
        const userRoles = member.roles.cache.map(role => ({
          id: role.id,
          name: role.name
        }));
        
        logger.info(`User roles for ${interaction.user.tag}:`, {
          userId,
          roles: userRoles,
          verifiedRoleId: serverConfig.verifiedRoleId,
          hasVerifiedRole: serverConfig.verifiedRoleId ? member.roles.cache.has(serverConfig.verifiedRoleId) : false
        });
        
        // 检查 verifiedRoleId 是否为 @everyone 角色
        const isEveryoneRole = serverConfig.verifiedRoleId === interaction.guild.id;
        if (isEveryoneRole) {
          logger.warn(`Verified role is set to @everyone (${interaction.guild.id}) for guild ${guildId}`);
        }
        
        if (serverConfig.verifiedRoleId && (member.roles.cache.has(serverConfig.verifiedRoleId) || isEveryoneRole)) {
          logger.info(`User ${interaction.user.tag} is already verified with role ${serverConfig.verifiedRoleId}`);
          return await interaction.editReply({
            content: '✅ 您已經通過驗證了！',
            ephemeral: true
          });
        }
        
        logger.info(`User ${interaction.user.tag} is not verified, continuing with verification process`);
      } catch (error) {
        logger.error('Error checking member roles:', { error: error.toString() });
      }
      
      // 生成验证令牌
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (serverConfig.settings?.verificationTimeout || 30));
      
      // 创建或更新验证记录
      let verificationRecord;
      try {
        if (modelName === 'supabase') {
          verificationRecord = await VerificationRecord.findOne({
            userId,
            guildId,
            completedAt: null
          });
        }
        
        if (verificationRecord) {
          verificationRecord = await model.updateRecord(verificationRecord, {
            token: verificationToken,
            expiresAt,
            attempts: 0
          });
        } else {
          verificationRecord = await model.createRecord({
            userId,
            guildId,
            token: verificationToken,
            expiresAt,
            verificationStatus: {
              reCaptcha: !serverConfig.requireRecaptcha,
              sms: !serverConfig.requireSMS
            }
          });
        }
      } catch (error) {
        logger.error(`${modelName} model error handling verification record:`, { error: error.toString() });
        
        if (modelName === 'supabase') {
          // 切换到内存模型
          logger.info('Switching to memory model for verification record');
          model = verificationModels.memory;
          modelName = 'memory';
          
          verificationRecord = await model.createRecord({
            userId,
            guildId,
            token: verificationToken,
            expiresAt,
            verificationStatus: {
              reCaptcha: !serverConfig.requireRecaptcha,
              sms: !serverConfig.requireSMS
            }
          });
        }
      }
      
      // 创建验证URL
      // 支持外網訪問的URL生成邏輯
      let baseUrl = process.env.BASE_URL;
      if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('您的公網IP')) {
        // 如果BASE_URL未設置或包含預設值，使用Netlify URL
        logger.warn('BASE_URL not properly configured, using Netlify URL');
        baseUrl = 'https://discord-verification-bot.netlify.app';
      }
      
      const verificationUrl = `${baseUrl}/verify/${userId}/${verificationToken}`;
      
      logger.info(`Generated verification URL for ${interaction.user.tag}: ${verificationUrl}`);
      
      // 发送私信
      try {
        await interaction.user.send({
          content: `👋 您好！請點擊以下按鈕完成**${interaction.guild.name}**的驗證過程：`,
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2, // Button
                  style: 5, // Link
                  label: '點擊此處進行驗證',
                  emoji: { name: '✅' },
                  url: verificationUrl
                }
              ]
            }
          ]
        });
        
        await interaction.editReply({
          content: '✅ 驗證鏈接已發送到您的私信！請查看您的私信完成驗證。',
          ephemeral: true
        });
        
        logger.info(`Sent verification DM to ${interaction.user.tag} using ${modelName} model`);
      } catch (dmError) {
        logger.error('Error sending DM:', { error: dmError.toString() });
        await interaction.editReply({
          content: '❌ 無法發送私信。請確保您已開啟接收私信的權限，然後再次嘗試。',
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2, // Button
                  style: 5, // Link
                  label: '點擊此處進行驗證',
                  emoji: { name: '✅' },
                  url: verificationUrl
                }
              ]
            }
          ],
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('Error during verification command:', { error: error.toString(), stack: error.stack });
      
      // 嘗試使用內存模式作為備份
      try {
        logger.info('Attempting to use memory model as fallback');
        const userId = interaction.user.id;
        const guildId = interaction.guild ? interaction.guild.id : null;
        
        if (!guildId) {
          return await interaction.editReply({
            content: '❌ 此命令只能在Discord伺服器中使用。',
            ephemeral: true
          });
        }
        
        // 使用內存模式生成驗證令牌
        const verificationToken = generateVerificationToken();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        
        // 創建內存中的驗證記錄
        const memoryModel = verificationModels.memory;
        await memoryModel.createRecord({
          userId,
          guildId,
          token: verificationToken,
          expiresAt,
          verificationStatus: {
            reCaptcha: true,
            sms: true
          }
        });
        
        // 創建驗證URL (使用備用URL)
        let baseUrl = process.env.BASE_URL;
        if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('您的公網IP')) {
          baseUrl = 'https://discord-verify.example.com';
        }
        const verificationUrl = `${baseUrl}/verify/${userId}/${verificationToken}`;
        
        // 發送私信
        await interaction.editReply({
          content: '⚠️ 驗證系統遇到了一些問題，但我們已經為您生成了一個臨時驗證鏈接。請點擊下方按鈕進行驗證：',
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2, // Button
                  style: 5, // Link
                  label: '點擊此處進行驗證',
                  emoji: { name: '✅' },
                  url: verificationUrl
                }
              ]
            }
          ],
          ephemeral: true
        });
        
        logger.info(`Sent fallback verification link to ${interaction.user.tag}`);
      } catch (fallbackError) {
        logger.error('Fallback error handling failed:', { error: fallbackError.toString() });
        try {
          await interaction.editReply({
            content: '❌ 啟動驗證過程時發生錯誤。請稍後再試，或聯繫伺服器管理員。',
            ephemeral: true
          });
        } catch (replyError) {
          logger.error('Error sending error reply:', { error: replyError.toString() });
        }
      }
    }
  }
};