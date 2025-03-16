// Setup Supabase database schema
require('dotenv').config();
const { getSupabaseClient } = require('./supabaseClient');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

/**
 * 更新行级安全策略
 */
async function updateRlsPolicy() {
  try {
    logger.info('正在更新 Supabase 行级安全策略...');
    
    const supabase = getSupabaseClient();
    
    // 手动执行 SQL 脚本来更新 RLS 策略
    const sqlFilePath = path.join(__dirname, '../../supabase/migrations/update_rls_policy.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // 分割 SQL 语句并逐个执行
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          logger.warn(`执行 SQL 语句时发生错误: ${error.message}\nSQL: ${statement}`);
        }
      }
      
      logger.info('行级安全策略更新成功');
    } else {
      logger.warn('找不到 update_rls_policy.sql 文件，跳过 RLS 策略更新');
    }
  } catch (error) {
    logger.error('更新 RLS 策略时发生错误:', { error: error.toString() });
  }
}

/**
 * Main function to setup Supabase database schema
 */
async function setupSupabase() {
  try {
    logger.info('Starting Supabase database schema setup...');
    
    // Check if Supabase credentials are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      logger.error('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.');
      process.exit(1);
    }
    
    const supabase = getSupabaseClient();
    
    // Create server_configs table
    logger.info('Creating server_configs table...');
    const { error: serverConfigsError } = await supabase.rpc('create_server_configs_table');
    
    if (serverConfigsError) {
      logger.error('Error creating server_configs table:', { error: serverConfigsError.message });
      // Try to check if table already exists
      const { data: tableExists } = await supabase
        .from('server_configs')
        .select('count(*)', { count: 'exact', head: true });
        
      if (tableExists !== null) {
        logger.info('server_configs table already exists.');
      } else {
        throw serverConfigsError;
      }
    } else {
      logger.info('server_configs table created successfully.');
    }
    
    // Create verification_records table
    logger.info('Creating verification_records table...');
    const { error: verificationRecordsError } = await supabase.rpc('create_verification_records_table');
    
    if (verificationRecordsError) {
      logger.error('Error creating verification_records table:', { error: verificationRecordsError.message });
      // Try to check if table already exists
      const { data: tableExists } = await supabase
        .from('verification_records')
        .select('count(*)', { count: 'exact', head: true });
        
      if (tableExists !== null) {
        logger.info('verification_records table already exists.');
      } else {
        throw verificationRecordsError;
      }
    } else {
      logger.info('verification_records table created successfully.');
    }
    
    // 更新行级安全策略
    await updateRlsPolicy();
    
    logger.info('Supabase database schema setup completed successfully!');
    logger.info('You can now use the Discord verification bot with Supabase.');
    logger.info('To start the bot in normal mode, run: npm run production');
  } catch (error) {
    logger.error('Error setting up Supabase schema:', { error: error.toString() });
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSupabase().catch(error => {
    logger.error('Unhandled error during Supabase setup:', { error: error.toString() });
    process.exit(1);
  });
}

module.exports = { setupSupabase, updateRlsPolicy };