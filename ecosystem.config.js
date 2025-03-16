module.exports = {
  apps: [
    {
      name: 'discord-verification-bot',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        USE_MOCK_MODE: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        USE_MOCK_MODE: 'false'
      }
    },
    {
      name: 'discord-verification-web',
      script: 'src/web-only.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        USE_MOCK_MODE: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        USE_MOCK_MODE: 'false'
      }
    }
  ]
};