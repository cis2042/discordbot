#!/bin/bash

# Discord Verification Bot Deployment Script
echo "===== Discord Verification Bot Deployment ====="

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env file from template. Please edit it with your credentials.${NC}"
    echo -e "${YELLOW}Exiting - Please update .env with your credentials and run again.${NC}"
    exit 1
  else
    echo -e "${RED}No .env.example file found. Please create a .env file manually.${NC}"
    exit 1
  fi
fi

# Check for required commands
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is required but not installed.${NC}" >&2; exit 1; }

# Display deployment mode options
echo -e "\n${GREEN}Select deployment mode:${NC}"
echo "1) Production mode (Connects to real Discord, MongoDB, etc.)"
echo "2) Mock mode (Simulates all external services)"
echo "3) Web-only mode (Only starts the verification web service)"
echo "4) Deploy with PM2 (Recommended for production servers)"
echo "5) Deploy with Docker (Containerized deployment)"
read -p "Enter your choice (1-5): " mode_choice

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
npm ci

# Create required directories
mkdir -p logs src/web/views src/web/public src/web/public/css src/web/public/js

case $mode_choice in
  1)
    # Production mode
    echo -e "\n${GREEN}Starting bot in production mode...${NC}"
    export USE_MOCK_MODE=false
    export NODE_ENV=production
    npm run production
    ;;
  2)
    # Mock mode
    echo -e "\n${GREEN}Starting bot in mock mode...${NC}"
    export USE_MOCK_MODE=true
    export NODE_ENV=development
    npm run mock
    ;;
  3)
    # Web-only mode
    echo -e "\n${GREEN}Starting web-only service...${NC}"
    export USE_MOCK_MODE=true
    export NODE_ENV=development
    node src/web-only.js
    ;;
  4)
    # PM2 deployment
    echo -e "\n${GREEN}Deploying with PM2...${NC}"
    command -v pm2 >/dev/null 2>&1 || { 
      echo -e "${YELLOW}PM2 not found. Installing globally...${NC}"
      npm install -g pm2
    }
    
    # Select PM2 environment
    echo -e "\n${GREEN}Select PM2 environment:${NC}"
    echo "1) Production (real services)"
    echo "2) Development (mock services)"
    read -p "Enter choice (1-2): " pm2_env
    
    if [ "$pm2_env" == "1" ]; then
      echo -e "${GREEN}Starting with PM2 in production mode...${NC}"
      pm2 start ecosystem.config.js --env production
    else
      echo -e "${GREEN}Starting with PM2 in development mode...${NC}"
      pm2 start ecosystem.config.js
    fi
    
    # Setup PM2 to start on system reboot
    echo -e "\n${GREEN}Setting up PM2 to start on system reboot...${NC}"
    pm2 save
    
    echo -e "\n${YELLOW}Do you want to setup PM2 to start on system reboot?${NC}"
    echo "This requires administrative privileges"
    read -p "Setup PM2 startup? (y/n): " setup_startup
    if [ "$setup_startup" == "y" ] || [ "$setup_startup" == "Y" ]; then
      pm2 startup
      echo -e "${GREEN}Follow the instructions above to complete the PM2 startup setup.${NC}"
    fi
    ;;
  5)
    # Docker deployment
    echo -e "\n${GREEN}Deploying with Docker...${NC}"
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: Docker is required but not installed.${NC}" >&2; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: docker-compose is required but not installed.${NC}" >&2; exit 1; }
    
    echo -e "\n${GREEN}Select Docker deployment mode:${NC}"
    echo "1) Full deployment (bot + web service)"
    echo "2) Web-only deployment"
    read -p "Enter choice (1-2): " docker_mode
    
    if [ "$docker_mode" == "1" ]; then
      echo -e "${GREEN}Starting full Docker deployment...${NC}"
      docker-compose up -d
    else
      echo -e "${GREEN}Starting web-only Docker deployment...${NC}"
      docker-compose up -d web-only
    fi
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Deployment completed!${NC}"