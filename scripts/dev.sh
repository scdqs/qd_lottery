#!/bin/bash

# QD Lottery 本地开发启动脚本
# 构建所有工作区并启动三个服务（backend / web-client / h5-client）

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  QD Lottery 本地开发环境启动${NC}"
echo -e "${GREEN}========================================${NC}"

# 第1步：先杀掉可能残留的旧进程
echo -e "\n${YELLOW}[1/3] 清理旧进程...${NC}"
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3002 2>/dev/null | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ 端口 3000/3001/3002 已清理${NC}"

# 第2步：构建所有工作区
echo -e "\n${YELLOW}[2/3] 构建所有工作区...${NC}"
npm run build
echo -e "${GREEN}✓ 构建完成${NC}"

# 第3步：并行启动三个服务
echo -e "\n${YELLOW}[3/3] 启动服务...${NC}"

cd "$PROJECT_ROOT/backend" && npm run dev &
PID_BACKEND=$!

cd "$PROJECT_ROOT/web-client" && npm run dev &
PID_WEB=$!

cd "$PROJECT_ROOT/h5-client" && npm run dev &
PID_H5=$!

sleep 2

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  所有服务已启动！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Backend:    http://localhost:3000"
echo -e "  Web Client: http://localhost:3001"
echo -e "  H5 Client:  http://localhost:3002"
echo -e "${GREEN}========================================${NC}"
echo -e "按 ${RED}Ctrl+C${NC} 停止所有服务\n"

# 捕获退出信号，统一清理子进程
cleanup() {
    echo -e "\n${YELLOW}正在停止所有服务...${NC}"
    kill $PID_BACKEND $PID_WEB $PID_H5 2>/dev/null
    wait $PID_BACKEND $PID_WEB $PID_H5 2>/dev/null
    echo -e "${GREEN}✓ 所有服务已停止${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
