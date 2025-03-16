// Supabase client utility
const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

/**
 * Initialize and get Supabase client
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.');
      throw new Error('Supabase credentials not found');
    }
    
    try {
      // 为 anon key 配置客户端选项
      const options = {
        auth: {
          persistSession: false, // 不要持久化会话，每次都使用 API key
          autoRefreshToken: false, // 不需要刷新令牌 
        },
        global: {
          headers: {
            'X-Client-Info': 'discord-verification-bot',
          },
        },
        db: {
          schema: 'public',
        },
      };
      
      supabase = createClient(supabaseUrl, supabaseKey, options);
      
      // 测试连接
      supabase.auth.getSession().then(() => {
        logger.info('Connected to Supabase');
      }).catch(error => {
        logger.error('Supabase connection test failed:', { error: error.toString(), details: error.message || error });
      });
      
      logger.info('Supabase client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', { error: error.toString(), details: error.message || error });
      throw error;
    }
  }
  
  return supabase;
}

module.exports = {
  getSupabaseClient
};