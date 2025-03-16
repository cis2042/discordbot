# Discord Verification Bot Deployment Guide

This guide provides instructions for deploying the Discord Verification Bot to your own server.

## Prerequisites

- Node.js v16.9.0 or higher
- npm or yarn
- MongoDB (optional for full functionality)
- Discord Bot credentials
- reCAPTCHA credentials
- Twilio credentials (optional for SMS verification)

## Deployment Options

There are multiple ways to deploy this bot depending on your needs:

### Option 1: Direct Deployment with Node.js

1. Clone the repository to your server
2. Copy `.env.example` to `.env` and fill in the required credentials
3. Install dependencies
   ```bash
   npm install
   ```
4. Start the bot in production mode
   ```bash
   npm run production
   ```

### Option 2: Deploy with PM2 (Recommended for Production)

PM2 is a process manager for Node.js that helps keep your application online 24/7.

1. Install PM2 globally
   ```bash
   npm install -g pm2
   ```

2. Clone the repository and configure `.env` file

3. Start the application with PM2
   ```bash
   # Start in production mode
   pm2 start ecosystem.config.js --env production
   
   # Or start in mock mode for testing
   pm2 start ecosystem.config.js
   ```

4. Setup PM2 to start on system reboot
   ```bash
   pm2 startup
   pm2 save
   ```

### Option 3: Deploy with Docker

1. Build the Docker image
   ```bash
   docker build -t discord-verification-bot .
   ```

2. Run the container
   ```bash
   docker run -d --name discord-bot \
     --env-file .env \
     -p 3000:3000 \
     discord-verification-bot
   ```

## Running in Mock Mode vs Production Mode

The bot can be run in two modes:

### Mock Mode

In mock mode, the bot simulates all external services (Discord, MongoDB, Twilio) without actually connecting to them. This is useful for testing and development.

```bash
# Run in mock mode
npm run mock

# Or with PM2
pm2 start ecosystem.config.js
```

### Production Mode

In production mode, the bot connects to real external services. Make sure all credentials are properly configured in your `.env` file.

```bash
# Run in production mode
npm run production

# Or with PM2
pm2 start ecosystem.config.js --env production
```

## Web-Only Deployment

If you only need the web verification interface without the Discord bot functionality, you can use the web-only service:

```bash
# Run the web-only service
node src/web-only.js

# Or with PM2
pm2 start ecosystem.config.js --only discord-verification-web
```

## System Requirements

- Memory: At least 512MB RAM
- CPU: 1 vCPU or more
- Disk: 1GB+ for the application and logs
- Network: Outbound connections to Discord, MongoDB, Twilio, and Google reCAPTCHA

## Logging

Logs are stored in the `logs` directory. In production mode, you may want to set up log rotation to prevent the log files from growing too large.

## Troubleshooting

If you encounter WebSocket connection errors from Discord:

1. Check that your `DISCORD_BOT_TOKEN` is correct
2. Ensure all required intents are enabled in the Discord Developer Portal
3. If testing locally, try running in mock mode with `npm run mock`
4. Check if your server's network allows outbound WebSocket connections

## Monitoring

For production deployments, it's recommended to set up monitoring to ensure the bot stays online. PM2 provides basic monitoring with `pm2 monit` and `pm2 status`.

## Updating

To update the bot to a newer version:

1. Pull the latest changes
2. Install any new dependencies
3. Restart the application
   ```bash
   pm2 restart discord-verification-bot
   ```