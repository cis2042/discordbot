// Event handler for when the bot is ready
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    try {
      logger.info(`Discord Verification Bot is online! Logged in as ${client.user.tag}`);
      
      // Set bot activity status
      try {
        client.user.setActivity('/verify');
        logger.info('Bot activity set to "/verify"');
      } catch (error) {
        logger.warn('Could not set bot activity:', { error: error.toString() });
      }
      
      // Log statistics
      const mockMode = process.env.USE_MOCK_MODE === 'true';
      
      // Get guild count
      try {
        const guildCount = client.guilds?.cache?.size || 0;
        logger.info(`Serving ${guildCount} servers`);
      } catch (error) {
        logger.warn('Could not get guild count:', { error: error.toString() });
      }
      
      // Get user count (skip in mock mode to avoid unnecessary API calls)
      if (!mockMode) {
        try {
          const userCount = client.users?.cache?.size || 0;
          logger.info(`Monitoring ${userCount} users`);
        } catch (error) {
          logger.warn('Could not get user count:', { error: error.toString() });
        }
      }
      
      // Check bot permissions in all guilds
      if (!mockMode) {
        try {
          logger.info('Checking bot permissions in servers...');
          if (client.guilds?.cache?.forEach) {
            client.guilds.cache.forEach(guild => {
              try {
                const botMember = guild.members.cache.get(client.user.id);
                if (botMember) {
                  const missingPermissions = checkRequiredPermissions(botMember);
                  if (missingPermissions.length > 0) {
                    logger.warn(`⚠️ Missing permissions in ${guild.name}: ${missingPermissions.join(', ')}`);
                  } else {
                    logger.info(`✅ All required permissions available in ${guild.name}`);
                  }
                }
              } catch (error) {
                logger.error(`Error checking permissions in ${guild.name}:`, { error: error.toString() });
              }
            });
          }
        } catch (error) {
          logger.error('Error checking guild permissions:', { error: error.toString() });
        }
      } else {
        logger.info('[MOCK] Skipping permission checks in mock mode');
      }
    } catch (error) {
      logger.error('Error in ready event handler:', { error: error.toString(), stack: error.stack });
    }
  }
};

// Helper function to check if the bot has all required permissions
function checkRequiredPermissions(botMember) {
  try {
    const requiredPermissions = [
      'ManageRoles',
      'SendMessages',
      'EmbedLinks',
      'ReadMessageHistory',
      'UseApplicationCommands'
    ];
    
    return requiredPermissions.filter(permission => !botMember.permissions.has(permission));
  } catch (error) {
    logger.error('Error checking permissions:', { error: error.toString() });
    return ['Error checking permissions'];
  }
}