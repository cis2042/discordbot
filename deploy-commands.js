// 部署斜線命令到 Discord 服務器
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');
const { validateEnvironment } = require('./src/utils/config');

// 驗證環境變數
const envValidation = validateEnvironment();
if (!envValidation.valid) {
  logger.error('環境變數驗證失敗. 部署命令可能無法正常運行.');
}

// 獲取所有命令文件
const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 讀取所有命令
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      logger.info(`Loaded command for deployment: ${command.data.name}`);
    } else {
      logger.warn(`Command ${filePath} missing required "data" or "execute" property.`);
    }
  } catch (error) {
    logger.error(`Error loading command ${filePath}:`, { error: error.toString() });
  }
}

// 檢查是否有命令可部署
if (commands.length === 0) {
  logger.error('No commands found to deploy. Make sure command files exist in src/commands/ directory.');
  process.exit(1);
}

// 檢查環境變數
if (!process.env.DISCORD_BOT_TOKEN) {
  logger.error('DISCORD_BOT_TOKEN not found in environment variables.');
  logger.info('Please set up your .env file with DISCORD_BOT_TOKEN.');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  logger.error('CLIENT_ID not found in environment variables.');
  logger.info('Please set up your .env file with CLIENT_ID (your Discord application ID).');
  process.exit(1);
}

// 準備部署
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

// Check mock mode
const mockMode = process.env.USE_MOCK_MODE === 'true';
if (mockMode) {
  logger.info('Running in MOCK MODE - This will simulate command deployment without actually connecting to Discord.');
  logger.info(`Would deploy ${commands.length} slash commands to application ${process.env.CLIENT_ID}.`);
  
  // Print commands that would be deployed
  commands.forEach(cmd => {
    logger.info(`Command: /${cmd.name} - ${cmd.description}`);
    if (cmd.options) {
      cmd.options.forEach(opt => {
        logger.info(`  Option: ${opt.name} (${opt.required ? 'required' : 'optional'}) - ${opt.description}`);
      });
    }
  });
  logger.info('Command deployment simulation complete. To actually deploy, set USE_MOCK_MODE=false in .env');
  process.exit(0);
}

// 部署命令
(async () => {
  try {
    logger.info(`Starting to register ${commands.length} slash commands...`);
    
    // 部署到全局
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    
    logger.info(`Successfully registered ${data.length} slash commands!`);
    logger.info('Command list:');
    data.forEach(cmd => {
      logger.info(`- /${cmd.name}: ${cmd.description}`);
    });
    
  } catch (error) {
    logger.error('Error deploying commands:', { error: error.toString(), stack: error.stack });
    
    // More specific error information
    if (error.code === 50035) {
      logger.error('Invalid form body error. Check command options order - required options must be placed before non-required options.');
    } else if (error.code === 401) {
      logger.error('Unauthorized. Make sure your DISCORD_BOT_TOKEN is correct.');
    } else if (error.code === 404) {
      logger.error('Not found. Make sure your CLIENT_ID is correct.');
    }
  }
})();