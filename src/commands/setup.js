// Command to setup verification system for a server
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerConfig = require('../models/ServerConfig');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('設置驗證系統')
    .addRoleOption(option => 
      option.setName('verified_role')
        .setDescription('驗證成功後分配的角色 (⚠️ 請勿選擇 @everyone！)')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('require_recaptcha')
        .setDescription('是否需要reCAPTCHA驗證')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('require_sms')
        .setDescription('是否需要SMS驗證')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('human_role')
        .setDescription('完成SMS驗證後授予的Human角色 (⚠️ 請勿選擇 @everyone！)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('welcome_message')
        .setDescription('驗證成功後顯示的歡迎消息')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('timeout')
        .setDescription('驗證超時時間（分鐘）')
        .setRequired(false)
        .setMinValue(5)
        .setMaxValue(1440))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const guildId = interaction.guild.id;
    const verifiedRole = interaction.options.getRole('verified_role');
    
    // 检查是否选择了 @everyone 角色
    if (verifiedRole.id === interaction.guild.id) {
      logger.warn(`User ${interaction.user.tag} attempted to set @everyone as verified role in guild ${guildId}`);
      
      // 获取服务器中的所有角色，排除 @everyone
      const availableRoles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .map(role => `<@&${role.id}>`)
        .join(', ');
      
      return await interaction.editReply({
        content: `## ❌ 錯誤：無法使用 @everyone 作為驗證角色\n\n@everyone 角色包含所有伺服器成員，無法用於區分已驗證和未驗證的用戶。\n\n請選擇一個特定的角色，例如：${availableRoles || '請先創建一個角色'}`,
        ephemeral: true
      });
    }
    
    // 检查 human_role 是否为 @everyone
    const humanRole = interaction.options.getRole('human_role');
    if (humanRole && humanRole.id === interaction.guild.id) {
      logger.warn(`User ${interaction.user.tag} attempted to set @everyone as human role in guild ${guildId}`);
      
      // 获取服务器中的所有角色，排除 @everyone
      const availableRoles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .map(role => `<@&${role.id}>`)
        .join(', ');
      
      return await interaction.editReply({
        content: `## ❌ 錯誤：無法使用 @everyone 作為 Human 角色\n\n@everyone 角色包含所有伺服器成員，無法用於區分已驗證和未驗證的用戶。\n\n請選擇一個特定的角色，例如：${availableRoles || '請先創建一個角色'}`,
        ephemeral: true
      });
    }
    
    const verifiedRoleId = verifiedRole.id;
    const humanRoleId = humanRole?.id;
    const requireRecaptcha = interaction.options.getBoolean('require_recaptcha');
    const requireSMS = interaction.options.getBoolean('require_sms');
    const welcomeMessage = interaction.options.getString('welcome_message') || 
      '歡迎加入我們的服務器！你已通過驗證。';
    const timeout = interaction.options.getInteger('timeout') || 30;
    
    // 检查机器人是否有权限管理所选角色
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
    if (verifiedRole.position >= botMember.roles.highest.position) {
      logger.warn(`Bot cannot manage role ${verifiedRole.name} in guild ${guildId} due to role hierarchy`);
      return await interaction.editReply({
        content: '❌ 機器人無法管理所選角色。請確保所選角色位於機器人角色之下。',
        ephemeral: true
      });
    }
    
    // Check if in mock mode
    const mockMode = process.env.USE_MOCK_MODE === 'true';
    
    try {
      // Find or create server configuration
      let serverConfig;
      
      if (mockMode) {
        logger.info('[MOCK] Simulating server configuration setup');
        serverConfig = {
          guildId,
          verifiedRoleId,
          humanRoleId,
          requireRecaptcha,
          requireSMS,
          welcomeMessage,
          settings: {
            verificationTimeout: timeout
          }
        };
      } else {
        try {
          serverConfig = await ServerConfig.findOne({ guildId });
          
          if (serverConfig) {
            // Update existing configuration
            serverConfig = await ServerConfig.findOneAndUpdate({ guildId }, {
              verifiedRoleId,
              humanRoleId,
              requireRecaptcha,
              requireSMS,
              welcomeMessage,
              settings: {
                verificationTimeout: timeout
              }
            });
          } else {
            // Create new configuration
            serverConfig = await ServerConfig.create({
              guildId,
              verifiedRoleId,
              humanRoleId,
              requireRecaptcha,
              requireSMS,
              welcomeMessage,
              settings: {
                deleteMessagesAfterVerification: true,
                verificationTimeout: timeout,
                maxAttempts: 3
              }
            });
          }
        } catch (dbError) {
          logger.error('Database error during setup command:', { error: dbError.toString() });
          logger.warn('继续使用临时解决方案，不保存到数据库');
          
          // 临时解决方案：即使无法保存到数据库，也创建一个内存中的配置对象
          serverConfig = {
            guildId,
            verifiedRoleId,
            humanRoleId,
            requireRecaptcha,
            requireSMS,
            welcomeMessage,
            settings: {
              deleteMessagesAfterVerification: true,
              verificationTimeout: timeout,
              maxAttempts: 3
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }
      
      // Build response message
      let responseMessage = '✅ 驗證系統設置成功！\n\n';
      
      // 如果使用临时方案，添加警告信息
      if (!mockMode && !serverConfig.id) {
        responseMessage = '⚠️ 驗證系統已設置，但由於數據庫連接問題，配置可能無法永久保存。\n\n';
      }
      
      responseMessage += `**驗證角色:** <@&${verifiedRoleId}>\n`;
      
      if (humanRoleId) {
        responseMessage += `**Human角色:** <@&${humanRoleId}>\n`;
      }
      
      responseMessage += `**需要reCAPTCHA:** ${requireRecaptcha ? '是' : '否'}\n`;
      responseMessage += `**需要SMS驗證:** ${requireSMS ? '是' : '否'}\n`;
      responseMessage += `**驗證超時:** ${timeout} 分鐘\n`;
      responseMessage += `**歡迎消息:** ${welcomeMessage}`;
      
      if (mockMode) {
        responseMessage += '\n\n⚠️ 注意：系統正在模擬模式下運行，未與實際數據庫連接。';
      }
      
      await interaction.editReply({
        content: responseMessage,
        ephemeral: true
      });
      
      logger.info(`Server ${interaction.guild.name} (${guildId}) configured verification system`, {
        requireRecaptcha,
        requireSMS,
        timeout
      });
    } catch (error) {
      logger.error('Error setting up verification system:', { error: error.toString(), stack: error.stack });
      await interaction.editReply({
        content: '❌ 設置驗證系統時發生錯誤。請稍後再試。',
        ephemeral: true
      });
    }
  }
};