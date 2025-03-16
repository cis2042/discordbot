// Web-only service for verification portal
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const { validateEnvironment, getConfig } = require('./utils/config');
const { createMockDiscordClient } = require('./utils/mockDiscord');
const { setupMockModeErrorHandling } = require('./utils/discordErrorHandler');
const webService = require('./web/server');

// Validate environment variables
const envValidation = validateEnvironment();
if (!envValidation.valid) {
  logger.warn('Environment validation failed. Some features may not work correctly.');
}

// Get config 
const config = getConfig();

// Always run in mock mode for web-only service
process.env.USE_MOCK_MODE = 'true';
logger.info('Web-only mode activated - Always uses mock mode for Discord client');

// Setup special error handling for Discord WebSocket errors
setupMockModeErrorHandling();

// Create mock Discord client (always use mock in web-only mode)
let client;
try {
  client = createMockDiscordClient();
  logger.info('[WEB-ONLY] Created mock Discord client for web service');
} catch (error) {
  logger.error('Error creating mock Discord client:', { error: error.toString() });
  logger.info('Creating simplified mock client...');
  
  // Create a very basic mock client if the full one fails
  client = {
    user: { tag: 'SimpleMockBot', id: '00000000' },
    guilds: { 
      cache: { 
        get: () => ({ name: 'Mock Server' }), 
        forEach: () => {} 
      } 
    },
    on: () => client,
    once: () => client,
    login: () => Promise.resolve('mock-token')
  };
}

// Create required directories
const createRequiredDirectories = () => {
  const dirs = [
    path.join(__dirname, '..', 'logs'),
    path.join(__dirname, 'web', 'views'),
    path.join(__dirname, 'web', 'public'),
    path.join(__dirname, 'web', 'public', 'css'),
    path.join(__dirname, 'web', 'public', 'js')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

createRequiredDirectories();

// Start web service
const webApp = webService.start(client);

// Simulate login for the mock client
if (client.login) {
  try {
    client.login('mock-token').catch(error => {
      logger.warn('Error in mock client login (non-critical):', { error: error.toString() });
    });
  } catch (error) {
    // Ignore login errors in web-only mode
    logger.warn('Mock client login failed (non-critical):', { error: error.toString() });
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down web service...');
  
  if (webApp) {
    logger.info('Web server shutdown');
  }
  
  logger.info('Goodbye!');
  process.exit(0);
});

// Simpler error handling
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason: reason ? String(reason) : 'Unknown reason' });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: String(error), stack: error.stack });
});

logger.info('Web-only service started. Discord bot functionality is simulated.');