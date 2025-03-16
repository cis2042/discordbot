// Event handler for when a new member joins the server
const ServerConfig = require('../models/ServerConfig');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      // Check if verification is set up for this server
      const serverConfig = await ServerConfig.findOne({ guildId: member.guild.id });
      
      if (!serverConfig) {
        console.log(`No verification setup for guild ${member.guild.name} (${member.guild.id})`);
        return;
      }
      
      // Send welcome message with verification instructions
      try {
        await member.send({
          content: `👋 歡迎加入 **${member.guild.name}**！\n\n為了確保服務器安全，我們需要您完成驗證過程。請在服務器中使用 \`/verify\` 命令開始驗證。\n\n完成驗證後，您將獲得完整的服務器訪問權限。`
        });
        console.log(`Sent verification instructions to new member ${member.user.tag} in ${member.guild.name}`);
      } catch (error) {
        console.error(`Could not send verification DM to ${member.user.tag}:`, error);
      }
    } catch (error) {
      console.error('Error handling new guild member:', error);
    }
  }
};