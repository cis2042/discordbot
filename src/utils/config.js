// Configuration helper utility
const logger = require('./logger');

// Load and validate required environment variables
function validateEnvironment() {
  const required = {
    basic: ['DISCORD_BOT_TOKEN', 'CLIENT_ID'],
    verification: ['RECAPTCHA_SITE_KEY', 'RECAPTCHA_SECRET_KEY'],
    sms: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    web: ['PORT', 'BASE_URL']
  };
  
  // Add database-specific required variables
  if (process.env.DATABASE_TYPE === 'supabase') {
    required.database = ['SUPABASE_URL', 'SUPABASE_KEY'];
  }
  
  const missing = {};
  
  // Check each category
  for (const [category, vars] of Object.entries(required)) {
    missing[category] = [];
    
    for (const envVar of vars) {
      if (!process.env[envVar]) {
        missing[category].push(envVar);
      }
    }
  }
  
  // Log results
  for (const [category, missingVars] of Object.entries(missing)) {
    if (missingVars.length > 0) {
      logger.warn(`Missing ${category} environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  // Check critical variables
  const missingCritical = missing.basic.length > 0;
  
  if (missingCritical && process.env.USE_MOCK_MODE !== 'true') {
    logger.error('Missing critical environment variables. Bot may not function correctly.');
    logger.info('Please set all required variables in .env file or consider running with USE_MOCK_MODE=true');
  }
  
  // Return overall validation result
  return {
    valid: !missingCritical || process.env.USE_MOCK_MODE === 'true',
    missing
  };
}

// Get configuration with defaults
function getConfig() {
  return {
    discord: {
      token: process.env.DISCORD_BOT_TOKEN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    },
    database: {
      type: process.env.DATABASE_TYPE || 'supabase',
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      }
    },
    recaptcha: {
      siteKey: process.env.RECAPTCHA_SITE_KEY,
      secretKey: process.env.RECAPTCHA_SECRET_KEY
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    web: {
      port: parseInt(process.env.PORT || '3000', 10),
      baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
    },
    mockMode: process.env.USE_MOCK_MODE === 'true',
    debug: process.env.NODE_ENV !== 'production'
  };
}

module.exports = {
  validateEnvironment,
  getConfig
};