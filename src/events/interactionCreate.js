// Event handler for interactions (slash commands and buttons)
const { Collection, Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Log all interactions for debugging
    logger.info(`Received interaction: ${interaction.type} from ${interaction.user.tag}`, {
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
      interactionType: interaction.type
    });
    
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return interaction.reply({
          content: '❌ 無法執行指令。指令可能已被移除或無法使用。',
          ephemeral: true
        }).catch(error => {
          logger.error(`Failed to reply to command ${interaction.commandName}:`, { error: error.toString() });
        });
      }
      
      // Command cooldowns
      const { cooldowns } = client;
      
      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
      }
      
      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;
      
      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        
        if (now < expirationTime) {
          const expiredTimestamp = Math.round(expirationTime / 1000);
          return interaction.reply({
            content: `請稍等，您需要等待 <t:${expiredTimestamp}:R> 後才能再次使用 \`/${command.data.name}\` 命令。`,
            ephemeral: true
          }).catch(error => {
            logger.error(`Failed to send cooldown message:`, { error: error.toString() });
          });
        }
      }
      
      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
      
      try {
        logger.info(`Executing command: ${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, { 
          error: error.toString(),
          stack: error.stack
        });
        
        const errorMessage = {
          content: '❌ 執行此命令時發生錯誤。',
          ephemeral: true
        };
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (replyError) {
          logger.error(`Failed to send error message:`, { error: replyError.toString() });
        }
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      const [type, ...args] = interaction.customId.split('_');
      
      logger.info(`Button pressed: ${interaction.customId} by ${interaction.user.tag}`);
      
      switch (type) {
        case 'verify':
          // Handle verification buttons
          // This would be implemented for any additional button-based verification steps
          break;
        default:
          logger.warn(`Unknown button interaction: ${interaction.customId}`);
      }
    }
  }
};