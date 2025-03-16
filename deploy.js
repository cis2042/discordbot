// 部署 Discord 機器人到生產環境
require('dotenv').config();
const { validateEnvironment, getConfig } = require('./src/utils/config');
const logger = require('./src/utils/logger');
const fs = require('fs');
const path = require('path');

// 檢查環境變數
const envValidation = validateEnvironment();
if (!envValidation.valid) {
  logger.error('環境變數驗證失敗。請確保以下環境變數已正確設置:');
  
  Object.entries(envValidation.missing).forEach(([category, vars]) => {
    if (vars.length > 0) {
      logger.error(`${category} 類別缺少: ${vars.join(', ')}`);
    }
  });
  
  process.exit(1);
}

// 獲取配置
const config = getConfig();

// 確保 mock 模式已關閉
if (process.env.USE_MOCK_MODE === 'false') {
  logger.error('請在 .env 文件中設置 USE_MOCK_MODE=false 以進行實際部署');
  logger.info('模擬模式適用於測試，但不適用於實際 Discord 部署');
  process.exit(1);
}

// 檢查 Supabase 連接
if (config.database.type === 'supabase') {
  try {
    const { getSupabaseClient } = require('./src/utils/supabaseClient');
    const supabase = getSupabaseClient();
    logger.info('Supabase 連接成功');
    
    // 確認表格是否存在
    async function checkSupabaseTables() {
      logger.info('檢查 Supabase 數據庫表...');
      
      try {
        // 檢查 server_configs 表
        const { data: serverConfigs, error: serverConfigsError } = await supabase
          .from('server_configs')
          .select('count(*)', { count: 'exact', head: true });
          
        if (serverConfigsError) {
          logger.error('server_configs 表不存在或無法訪問');
          logger.info('請運行 npm run supabase:setup 創建必要的數據庫表');
          return false;
        }
        
        // 檢查 verification_records 表
        const { data: verificationRecords, error: verificationRecordsError } = await supabase
          .from('verification_records')
          .select('count(*)', { count: 'exact', head: true });
          
        if (verificationRecordsError) {
          logger.error('verification_records 表不存在或無法訪問');
          logger.info('請運行 npm run supabase:setup 創建必要的數據庫表');
          return false;
        }
        
        logger.info('Supabase 數據庫表已準備就緒');
        return true;
      } catch (error) {
        logger.error('檢查 Supabase 表時發生錯誤:', { error: error.toString() });
        return false;
      }
    }
    
    // 執行檢查
    checkSupabaseTables().then(tablesReady => {
      if (!tablesReady) {
        process.exit(1);
      }
      
      // 繼續部署流程
      checkDiscordToken();
    });
  } catch (error) {
    logger.error('Supabase 連接失敗:', { error: error.toString() });
    process.exit(1);
  }
} else {
  logger.error(`不支持的數據庫類型: ${config.database.type}`);
  logger.info('目前只支持 Supabase 數據庫');
  process.exit(1);
}

// 檢查 Discord 令牌
function checkDiscordToken() {
  logger.info('檢查 Discord 令牌...');
  
  if (!process.env.DISCORD_BOT_TOKEN) {
    logger.error('DISCORD_BOT_TOKEN 未設置');
    process.exit(1);
  }
  
  if (!process.env.CLIENT_ID) {
    logger.error('CLIENT_ID 未設置');
    process.exit(1);
  }
  
  logger.info('Discord 令牌已設置');
  
  // 檢查斜線命令
  checkSlashCommands();
}

// 檢查斜線命令
function checkSlashCommands() {
  logger.info('檢查斜線命令...');
  
  const commandsPath = path.join(__dirname, 'src/commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  if (commandFiles.length === 0) {
    logger.error('找不到斜線命令文件');
    process.exit(1);
  }
  
  logger.info(`找到 ${commandFiles.length} 個斜線命令`);
  
  // 詢問是否要部署斜線命令
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('是否要部署斜線命令到 Discord? (y/n): ', answer => {
    readline.close();
    
    if (answer.toLowerCase() === 'y') {
      logger.info('正在部署斜線命令...');
      
      // 執行部署命令腳本
      const { execSync } = require('child_process');
      try {
        execSync('node deploy-commands.js', { stdio: 'inherit' });
        logger.info('斜線命令部署成功');
      } catch (error) {
        logger.error('斜線命令部署失敗:', { error: error.toString() });
        process.exit(1);
      }
    }
    
    // 詢問是否啟動機器人
    startBot();
  });
}

// 啟動機器人
function startBot() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('是否要啟動 Discord 機器人? (y/n): ', answer => {
    readline.close();
    
    if (answer.toLowerCase() === 'y') {
      logger.info('正在啟動 Discord 機器人...');
      
      // 執行生產模式命令
      const { spawn } = require('child_process');
      const bot = spawn('npm', ['run', 'production'], { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production', USE_MOCK_MODE: 'false' } 
      });
      
      bot.on('error', (error) => {
        logger.error('啟動 Discord 機器人時發生錯誤:', { error: error.toString() });
      });
      
      bot.on('exit', (code) => {
        if (code !== 0) {
          logger.error(`Discord 機器人退出，代碼: ${code}`);
        }
      });
      
      logger.info('Discord 機器人已啟動');
      logger.info('使用 Ctrl+C 停止機器人');
    } else {
      logger.info('部署準備完成，但未啟動機器人');
      logger.info('使用 npm run production 啟動機器人');
      process.exit(0);
    }
  });
}