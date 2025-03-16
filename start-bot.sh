#!/bin/bash

# 顯示腳本執行步驟
set -x

# 殺死所有運行中的Node.js進程
echo "正在停止所有Node.js進程..."
pkill -f node || true

# 等待所有進程完全停止
sleep 2

# 檢查端口是否被占用
PORT_CHECK=$(lsof -i:3001 | grep LISTEN)
if [ ! -z "$PORT_CHECK" ]; then
  echo "警告: 端口3001仍被占用，嘗試強制釋放..."
  kill -9 $(lsof -t -i:3001) || true
  sleep 1
fi

# 獲取公網IP (如果可能)
PUBLIC_IP=$(curl -s ifconfig.me || echo "您的公網IP")

# 設置環境變量
echo "設置環境變量..."
export NODE_ENV=production
export USE_MOCK_MODE=true
export BASE_URL="http://${PUBLIC_IP}:3001"
export PORT=3001

# 顯示當前設置
echo "當前設置:"
echo "BASE_URL = $BASE_URL"
echo "USE_MOCK_MODE = $USE_MOCK_MODE"
echo "NODE_ENV = $NODE_ENV"

# 啟動機器人
echo "啟動Discord驗證機器人..."
cd /Users/dw/Desktop/dev/discord\ project && npm run production 