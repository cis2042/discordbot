// Command to check verification status
const { SlashCommandBuilder } = require('discord.js');
const VerificationRecord = require('../models/VerificationRecord');
const ServerConfig = require('../models/ServerConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verification-status')
    .setDescription('查看您的驗證狀態'),
    
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      
      // Check server configuration
      const serverConfig = await ServerConfig.findOne({ guildId });
      
      if (!serverConfig) {
        return await interaction.editReply({
          content: '❌ 此服務器尚未設置驗證系統。請聯絡管理員。',
          ephemeral: true
        });
      }
      
      // Check if user is already verified
      const member = await interaction.guild.members.fetch(userId);
      if (member.roles.cache.has(serverConfig.verifiedRoleId)) {
        let status = '✅ 您已完成基本驗證';
        
        if (serverConfig.humanRoleId && member.roles.cache.has(serverConfig.humanRoleId)) {
          status += '，並通過了 SMS 驗證，獲得了 Human 角色';
        }
        
        return await interaction.editReply({
          content: `${status}。`,
          ephemeral: true
        });
      }
      
      // Check verification record
      const verificationRecord = await VerificationRecord.findOne({
        userId,
        guildId
      }).sort({ createdAt: -1 });
      
      if (!verificationRecord) {
        return await interaction.editReply({
          content: '❓ 您尚未開始驗證過程。請使用 `/verify` 命令開始驗證。',
          ephemeral: true
        });
      }
      
      // Build status message
      let statusMessage = '**您的驗證狀態：**\n\n';
      
      if (verificationRecord.completedAt) {
        statusMessage += '✅ 驗證已完成，但角色分配可能失敗。請聯絡管理員。\n';
      } else {
        statusMessage += '⏳ 驗證進行中\n\n';
        
        if (serverConfig.requireRecaptcha) {
          statusMessage += verificationRecord.verificationStatus.reCaptcha
            ? '✅ reCAPTCHA: 已完成\n'
            : '❌ reCAPTCHA: 未完成\n';
        }
        
        if (serverConfig.requireSMS) {
          statusMessage += verificationRecord.verificationStatus.sms
            ? '✅ SMS 驗證: 已完成\n'
            : '❌ SMS 驗證: 未完成\n';
        }
        
        // Check if verification is expired
        const now = new Date();
        if (verificationRecord.expiresAt && verificationRecord.expiresAt < now) {
          statusMessage += '\n⚠️ 您的驗證鏈接已過期。請使用 `/verify` 命令重新開始驗證。';
        } else {
          statusMessage += `\n⏱️ 驗證鏈接將在 ${formatTimeRemaining(verificationRecord.expiresAt)} 後過期。`;
        }
      }
      
      await interaction.editReply({
        content: statusMessage,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error checking verification status:', error);
      await interaction.editReply({
        content: '❌ 查詢驗證狀態時發生錯誤。請稍後再試。',
        ephemeral: true
      });
    }
  }
};

// Helper function to format time remaining
function formatTimeRemaining(expiryDate) {
  if (!expiryDate) return 'unknown time';
  
  const now = new Date();
  const diffMs = expiryDate - now;
  
  if (diffMs <= 0) return '0 秒';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins <= 0) return `${diffSecs} 秒`;
  return `${diffMins} 分鐘 ${diffSecs} 秒`;
}