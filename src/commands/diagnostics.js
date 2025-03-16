// 诊断命令 - 检查系统状态和数据库连接
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSupabaseClient } = require('../utils/supabaseClient');
const ServerConfig = require('../models/ServerConfig');
const VerificationRecord = require('../models/VerificationRecord');
const logger = require('../utils/logger');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diagnostics')
    .setDescription('檢查系統狀態和數據庫連接'),
    
  async execute(interaction) {
    logger.info(`Diagnostics command triggered by ${interaction.user.tag} in ${interaction.guild.name}`);
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const guildId = interaction.guild.id;
      const results = {
        system: {
          status: '✅ 正常',
          details: {}
        },
        database: {
          status: '⏳ 檢查中...',
          details: {}
        },
        serverConfig: {
          status: '⏳ 檢查中...',
          details: {}
        },
        permissions: {
          status: '⏳ 檢查中...',
          details: {}
        }
      };
      
      // 系统信息
      results.system.details = {
        uptime: `${Math.floor(process.uptime() / 60)} 分鐘`,
        memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        platform: process.platform,
        nodeVersion: process.version,
        mockMode: process.env.USE_MOCK_MODE === 'true' ? '是' : '否',
        databaseType: process.env.DATABASE_TYPE || 'supabase'
      };
      
      // 数据库连接测试
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('server_configs').select('count').limit(1);
        
        if (error) {
          results.database.status = '❌ 連接失敗';
          results.database.details.error = error.message;
          results.database.details.hint = '可能是 API 密鑰無效或 RLS 策略限制';
        } else {
          results.database.status = '✅ 連接成功';
          results.database.details.apiKeyType = process.env.SUPABASE_KEY.startsWith('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9') ? 
            '服務角色密鑰 (可繞過 RLS)' : '匿名密鑰 (受 RLS 限制)';
        }
      } catch (dbError) {
        results.database.status = '❌ 連接錯誤';
        results.database.details.error = dbError.toString();
      }
      
      // 服务器配置检查
      try {
        // 直接从数据库查询
        const supabase = getSupabaseClient();
        const { data: directData, error: directError } = await supabase
          .from('server_configs')
          .select('*')
          .eq('guild_id', guildId);
          
        if (directError) {
          results.serverConfig.status = '❌ 直接查詢失敗';
          results.serverConfig.details.directError = directError.message;
        } else if (directData && directData.length > 0) {
          results.serverConfig.status = '✅ 數據庫中存在配置';
          results.serverConfig.details.directData = {
            id: directData[0].id,
            guild_id: directData[0].guild_id,
            verified_role_id: directData[0].verified_role_id,
            human_role_id: directData[0].human_role_id,
            created_at: directData[0].created_at
          };
        } else {
          results.serverConfig.status = '❌ 數據庫中無配置';
        }
        
        // 通过模型查询
        const modelConfig = await ServerConfig.findOne({ guildId });
        if (modelConfig) {
          results.serverConfig.details.modelStatus = '✅ 模型可以獲取配置';
          results.serverConfig.details.modelData = {
            guildId: modelConfig.guildId,
            verifiedRoleId: modelConfig.verifiedRoleId,
            humanRoleId: modelConfig.humanRoleId
          };
        } else {
          results.serverConfig.details.modelStatus = '❌ 模型無法獲取配置';
        }
      } catch (configError) {
        if (results.serverConfig.status === '⏳ 檢查中...') {
          results.serverConfig.status = '❌ 檢查失敗';
        }
        results.serverConfig.details.error = configError.toString();
      }
      
      // 权限检查
      try {
        const guild = interaction.guild;
        const botMember = await guild.members.fetch(interaction.client.user.id);
        
        const requiredPermissions = [
          'ManageRoles',
          'SendMessages',
          'EmbedLinks',
          'ReadMessageHistory'
        ];
        
        const missingPermissions = requiredPermissions.filter(
          perm => !botMember.permissions.has(perm)
        );
        
        if (missingPermissions.length === 0) {
          results.permissions.status = '✅ 所有權限正常';
        } else {
          results.permissions.status = '❌ 缺少權限';
          results.permissions.details.missing = missingPermissions.join(', ');
        }
        
        // 检查角色位置
        if (results.serverConfig.details.modelData?.verifiedRoleId) {
          try {
            const verifiedRole = await guild.roles.fetch(results.serverConfig.details.modelData.verifiedRoleId);
            const botRole = botMember.roles.highest;
            
            if (verifiedRole && botRole.position <= verifiedRole.position) {
              results.permissions.details.rolePosition = '❌ 機器人角色位置過低，無法分配驗證角色';
            } else if (verifiedRole) {
              results.permissions.details.rolePosition = '✅ 機器人角色位置正常';
            }
          } catch (roleError) {
            results.permissions.details.roleError = roleError.toString();
          }
        }
      } catch (permError) {
        results.permissions.status = '❌ 檢查失敗';
        results.permissions.details.error = permError.toString();
      }
      
      // 创建诊断报告
      const embed = new EmbedBuilder()
        .setTitle('系統診斷報告')
        .setColor(0x0099FF)
        .setDescription('以下是系統各組件的狀態檢查結果')
        .addFields(
          { name: '系統狀態', value: `${results.system.status}\n\`\`\`運行時間: ${results.system.details.uptime}\n內存使用: ${results.system.details.memory}\n模擬模式: ${results.system.details.mockMode}\`\`\``, inline: false },
          { name: '數據庫連接', value: `${results.database.status}\n\`\`\`${results.database.details.error || results.database.details.apiKeyType || '無詳細信息'}\`\`\``, inline: false },
          { name: '服務器配置', value: `${results.serverConfig.status}\n\`\`\`${results.serverConfig.details.modelStatus || ''}\n${results.serverConfig.details.error || JSON.stringify(results.serverConfig.details.modelData || results.serverConfig.details.directData || {}, null, 2) || '無詳細信息'}\`\`\``, inline: false },
          { name: '權限檢查', value: `${results.permissions.status}\n\`\`\`${results.permissions.details.rolePosition || ''}\n${results.permissions.details.missing || results.permissions.details.error || '所有權限正常'}\`\`\``, inline: false }
        )
        .setFooter({ text: '診斷完成時間' })
        .setTimestamp();
      
      // 添加解决方案建议
      let recommendations = '';
      
      if (results.database.status.includes('❌')) {
        recommendations += '• 檢查 Supabase API 密鑰是否正確\n• 考慮使用服務角色密鑰\n• 在 Supabase 中禁用 RLS 或添加允許訪問的策略\n';
      }
      
      if (results.serverConfig.status.includes('❌')) {
        recommendations += '• 重新運行 `/setup` 命令設置服務器\n• 檢查數據庫表結構是否正確\n• 確保 `server_configs` 表存在並可訪問\n';
      }
      
      if (results.permissions.status.includes('❌')) {
        recommendations += '• 確保機器人有足夠的權限\n• 將機器人角色移至角色列表較高位置\n• 重新邀請機器人並授予所有必要權限\n';
      }
      
      if (recommendations) {
        embed.addFields({ name: '建議解決方案', value: recommendations, inline: false });
      }
      
      await interaction.editReply({
        embeds: [embed],
        ephemeral: true
      });
      
      logger.info('Diagnostics completed for', {
        guild: interaction.guild.name,
        results: JSON.stringify(results)
      });
    } catch (error) {
      logger.error('Error during diagnostics command:', { error: error.toString(), stack: error.stack });
      await interaction.editReply({
        content: '❌ 執行診斷時發生錯誤。請查看日誌獲取詳細信息。',
        ephemeral: true
      });
    }
  }
}; 