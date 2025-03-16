#!/bin/bash

# Discord Verification Bot Restart Script
echo "===== Discord Verification Bot Restart ====="

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check how the bot is running
if pm2 list | grep -q "discord-verification"; then
  # Running with PM2
  echo -e "${GREEN}Restarting with PM2...${NC}"
  pm2 restart discord-verification-bot discord-verification-web
  echo -e "${GREEN}Bot restarted successfully!${NC}"
  echo -e "Check status with: ${YELLOW}pm2 status${NC}"
elif pgrep -f "docker" > /dev/null; then
  # Check if running with Docker
  if docker ps | grep -q "discord-verification"; then
    echo -e "${GREEN}Restarting Docker containers...${NC}"
    docker-compose restart
    echo -e "${GREEN}Docker containers restarted successfully!${NC}"
    echo -e "Check status with: ${YELLOW}docker ps${NC}"
  else
    echo -e "${RED}No Discord verification Docker containers running.${NC}"
    exit 1
  fi
else
  # Direct Node.js process - kill and restart
  echo -e "${GREEN}Restarting Node.js process...${NC}"
  pkill -f "node src/index.js" || true
  pkill -f "node src/web-only.js" || true
  
  # Wait for processes to terminate
  sleep 2
  
  # Check if .env file exists and has USE_MOCK_MODE
  if [ -f .env ] && grep -q "USE_MOCK_MODE" .env; then
    # Source environment variables from .env
    export $(grep -v '^#' .env | xargs)
  else
    # Default to mock mode if no config found
    export USE_MOCK_MODE=true
  fi
  
  # Start in background
  if [ "$USE_MOCK_MODE" == "true" ]; then
    echo -e "${GREEN}Starting in mock mode...${NC}"
    nohup npm run mock > logs/bot.log 2>&1 &
  else
    echo -e "${GREEN}Starting in production mode...${NC}"
    nohup npm run production > logs/bot.log 2>&1 &
  fi
  
  echo -e "${GREEN}Bot restarted successfully!${NC}"
  echo -e "Check logs with: ${YELLOW}tail -f logs/bot.log${NC}"
fi