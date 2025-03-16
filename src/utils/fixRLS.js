// 用于修复 Supabase RLS 问题的工具
require('dotenv').config();
const { getSupabaseClient } = require('./supabaseClient');
const logger = require('./logger');

async function fixRLS() {
  try {
    logger.info('开始修复 Supabase 行级安全策略...');
    
    const supabase = getSupabaseClient();
    
    // 1. 为 server_configs 表添加 anon 用户的 RLS 策略
    const serverConfigSql = `
    BEGIN;
    -- 删除现有策略
    DROP POLICY IF EXISTS "Server configs are accessible by authenticated users" ON server_configs;
    DROP POLICY IF EXISTS "Server configs are accessible by anon users" ON server_configs;
    
    -- 创建新策略，允许匿名用户访问
    CREATE POLICY "Server configs are accessible by anon users"
      ON server_configs
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
    COMMIT;
    `;
    
    // 2. 为 verification_records 表添加 anon 用户的 RLS 策略
    const verificationRecordsSql = `
    BEGIN;
    -- 删除现有策略
    DROP POLICY IF EXISTS "Verification records are accessible by authenticated users" ON verification_records;
    DROP POLICY IF EXISTS "Verification records are accessible by anon users" ON verification_records;
    
    -- 创建新策略，允许匿名用户访问
    CREATE POLICY "Verification records are accessible by anon users"
      ON verification_records
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
    COMMIT;
    `;
    
    // 执行 SQL 语句
    logger.info('修复 server_configs 表的 RLS 策略...');
    const { error: serverConfigError } = await supabase.rpc('exec_sql', { sql: serverConfigSql });
    if (serverConfigError) {
      logger.error('修复 server_configs 表 RLS 策略时出错:', { error: serverConfigError.message });
    } else {
      logger.info('server_configs 表 RLS 策略修复成功');
    }
    
    logger.info('修复 verification_records 表的 RLS 策略...');
    const { error: verificationRecordsError } = await supabase.rpc('exec_sql', { sql: verificationRecordsSql });
    if (verificationRecordsError) {
      logger.error('修复 verification_records 表 RLS 策略时出错:', { error: verificationRecordsError.message });
    } else {
      logger.info('verification_records 表 RLS 策略修复成功');
    }
    
    logger.info('Supabase RLS 策略修复完成');
  } catch (error) {
    logger.error('修复 RLS 策略时发生错误:', { error: error.toString() });
  }
}

// 如果直接运行此文件，则执行修复
if (require.main === module) {
  fixRLS().catch(error => {
    logger.error('修复 RLS 策略时发生未处理的错误:', { error: error.toString() });
    process.exit(1);
  });
}

module.exports = { fixRLS }; 