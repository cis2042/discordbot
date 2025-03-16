// Main entry point for the Discord Verification Bot
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const webService = require('./web/server');
const logger = require('./utils/logger');
const { validateEnvironment, getConfig } = require('./utils/config');
const { createMockDiscordClient } = require('./utils/mockDiscord');
const { setupMockModeErrorHandling, isDiscordConnectionError } = require('./utils/discordErrorHandler');

// Validate environment variables
const envValidation = validateEnvironment();
if (!envValidation.valid) {
  logger.warn('Environment validation failed. Some features may not work correctly.');
}

// Get config 
const config = getConfig();

// 直接从环境变量获取 mock 模式设置，不再检测环境
let mockMode = process.env.USE_MOCK_MODE === 'true';

if (mockMode) {
  logger.info('Running in MOCK MODE - No actual external APIs will be called');
  // Setup special error handling for Discord WebSocket errors in mock mode
  setupMockModeErrorHandling();
}

// Create Discord client based on mode
let client;
try {
  if (mockMode) {
    // Use mock client in mock mode
    client = createMockDiscordClient();
    logger.info('[MOCK] Created mock Discord client');
  } else {
    // Real Discord client in normal mode with adjusted settings
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ],
      failIfNotExists: false,
      retryLimit: 1, // Minimal retry attempts
      restRequestTimeout: 10000, // Reduced timeout
      restWsBridgeTimeout: 5000 // Reduced timeout
    });
  }
} catch (error) {
  // If Discord client creation fails, fall back to mock mode
  logger.error('Error creating Discord client:', { error: error.toString() });
  logger.info('Falling back to mock mode due to client creation error');
  process.env.USE_MOCK_MODE = 'true';
  mockMode = true;
  client = createMockDiscordClient();
}

// Initialize collections for commands and cooldowns
if (!client.commands) client.commands = new Collection();
if (!client.cooldowns) client.cooldowns = new Collection();

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

logger.info(`Loading ${commandFiles.length} command files...`);
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    } else {
      logger.warn(`Command ${filePath} is missing required "data" or "execute" property.`);
    }
  } catch (error) {
    logger.error(`Error loading command ${filePath}:`, { error: error.toString() });
  }
}

// Load all event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

logger.info(`Loading ${eventFiles.length} event files...`);
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  try {
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    logger.info(`Loaded event: ${event.name}`);
  } catch (error) {
    logger.error(`Error loading event ${filePath}:`, { error: error.toString() });
  }
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

// Initialize database based on type
const databaseType = config.database.type;

if (databaseType === 'supabase' && !mockMode) {
  // Initialize Supabase client
  const { getSupabaseClient } = require('./utils/supabaseClient');
  try {
    const supabase = getSupabaseClient();
    logger.info('Connected to Supabase');
  } catch (error) {
    logger.error('Supabase connection error:', { error: error.toString() });
    logger.warn('Bot will run with limited functionality. Verification features will not work properly.');
    
    if (!mockMode) {
      logger.info('Consider setting USE_MOCK_MODE=true in .env for testing without a database connection.');
    }
  }
} else {
  logger.info(`Using configuration for database type: ${databaseType} in ${mockMode ? 'mock' : 'normal'} mode`);
}

// Start web service
const webApp = webService.start(client);

// Start login process based on mode
if (mockMode) {
  // In mock mode, simulate a successful login without actual Discord connection
  logger.info('[MOCK] Simulating Discord login in mock mode...');
  client.login('mock-token').then(() => {
    logger.info('[MOCK] Mock Discord login complete');
  }).catch(error => {
    // Should not happen with mock client
    if (!isDiscordConnectionError(error.toString())) {
      logger.error('[MOCK] Unexpected error in mock login:', { error: error.toString() });
    }
  });
} else {
  // Real mode with reduced retry attempts for production environments
  function loginWithRetry(attempt = 1, maxAttempts = 2, delay = 3000) {
    logger.info(`Attempting to log in to Discord (Attempt ${attempt}/${maxAttempts})...`);
    
    return client.login(config.discord.token)
      .then(() => {
        logger.info('Discord bot logged in successfully');
      })
      .catch(error => {
        logger.error(`Error logging in to Discord (Attempt ${attempt}/${maxAttempts}):`, { error: error.toString() });
        
        if (attempt < maxAttempts) {
          const nextDelay = delay * 1.5;
          logger.info(`Retrying in ${nextDelay/1000} seconds...`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(loginWithRetry(attempt + 1, maxAttempts, nextDelay));
            }, delay);
          });
        } else {
          logger.error('Maximum login attempts reached. Unable to connect to Discord.');
          logger.info('The bot will continue running with web service only functionality.');
          logger.info('Consider setting USE_MOCK_MODE=true in .env for testing without Discord connection.');
          
          // Switch to mock mode for the remaining functionality
          logger.info('Switching to mock mode to enable web interface functionality...');
          process.env.USE_MOCK_MODE = 'true';
          // Replace client with mock client for web functionality
          try {
            client = createMockDiscordClient();
            // Re-register event handlers
            for (const file of eventFiles) {
              try {
                const event = require(path.join(eventsPath, file));
                if (event.once) {
                  client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                  client.on(event.name, (...args) => event.execute(...args, client));
                }
              } catch (error) {
                // Ignore errors during re-registration
              }
            }
            // Simulate login
            client.login('mock-token').catch(() => {});
          } catch (error) {
            logger.error('Error creating mock client after Discord connection failure:', { 
              error: error.toString() 
            });
          }
        }
      });
  }
  
  loginWithRetry();
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  
  if (client) {
    client.destroy();
    logger.info('Discord client destroyed');
  }
  
  if (webApp) {
    logger.info('Web server shutdown');
  }
  
  logger.info('Goodbye!');
  process.exit(0);
});

// Simplified error handling to prevent unhandled rejections
process.on('unhandledRejection', (reason) => {
  // Skip Discord connection errors
  if (reason && isDiscordConnectionError(String(reason))) {
    return;
  }
  
  logger.error('Unhandled Rejection:', { 
    reason: reason ? String(reason) : 'Unknown reason'
  });
});

process.on('uncaughtException', (error) => {
  // Skip Discord connection errors
  if (error && isDiscordConnectionError(String(error))) {
    return;
  }
  
  logger.error('Uncaught Exception:', { 
    error: String(error), 
    stack: error.stack
  });
});