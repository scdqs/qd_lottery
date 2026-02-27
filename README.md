[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/scdqs/qd_lottery)
# 趣点摇一摇 - 实时互动抽奖系统

基于微信授权的实时互动抽奖平台，参与者通过手机"摇一摇"竞争，摇动次数最多者赢得奖品。

## 项目结构

本项目采用 monorepo 结构：

```
qd_lottery/
├── backend/                # 后端服务 (Express + Socket.IO)
│   ├── src/
│   │   ├── index.ts                  # 主入口，HTTP 路由
│   │   ├── websocket.ts              # WebSocket 实时通信
│   │   ├── SessionManager.ts         # 会话管理
│   │   ├── SessionCleanupService.ts  # 会话自动清理
│   │   ├── WeChatAuthService.ts      # 微信 OAuth 授权
│   │   ├── config/
│   │   │   └── security.ts           # 安全配置 (CORS/CSP/HSTS)
│   │   └── utils/
│   │       └── logger.ts             # 日志工具
│   └── Dockerfile
├── web-client/             # PC 端管理界面 (React + Vite)
│   ├── nginx.conf
│   └── Dockerfile
├── h5-client/              # H5 移动端 (React + Vite)
│   ├── nginx.conf
│   └── Dockerfile
├── scripts/
│   ├── dev.sh              # 本地开发启动脚本
│   └── load-test.ts        # 压力测试脚本
├── docker-compose.yml      # Docker 编排配置
└── package.json            # Monorepo 根配置
```

## 核心功能

- 微信 OAuth 2.0 授权登录
- WebSocket 实时摇动数据同步
- 可配置中奖人数
- 会话生命周期管理与自动清理
- PC 端实时展示参与者和摇动数据
- H5 端摇一摇交互（深色节日主题）
- 安全防护（CORS、CSP、HSTS、防点击劫持）

## 技术栈

### 后端
- Node.js 18+ / Express / TypeScript
- Socket.IO (WebSocket 实时通信)
- Jest + fast-check (测试)

### Web 端 (PC 管理界面)
- React 18+ / TypeScript / Vite
- Socket.IO-client / Chart.js / QRCode.js

### H5 端 (移动参与端)
- React 18+ / TypeScript / Vite
- Socket.IO-client / Axios

### 部署
- Docker Compose (三服务编排)
- Nginx (静态资源 + 反向代理 + SSL)

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 配置环境变量

```bash
# 后端
cd backend
cp .env.example .env
# 编辑 .env，填入微信开放平台配置

# 客户端（可选，默认指向 localhost:3000）
# web-client/.env.development
# h5-client/.env.development
```

主要环境变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端端口 | `3000` |
| `WECHAT_APP_ID` | 微信 AppID | - |
| `WECHAT_APP_SECRET` | 微信 AppSecret | - |
| `WECHAT_REDIRECT_URI` | 微信授权回调地址 | - |
| `H5_BASE_URL` | H5 客户端地址 | `http://localhost:5173` |
| `CORS_ORIGIN` | 允许的跨域来源 | `http://localhost:3001,http://localhost:5173` |
| `SESSION_CLEANUP_INTERVAL` | 会话清理间隔 (ms) | `3600000` (1小时) |
| `SESSION_EXPIRY_TIME` | 会话过期时间 (ms) | `86400000` (24小时) |

### 本地开发

```bash
# 方式一：使用启动脚本（推荐，自动并行启动三个服务）
bash scripts/dev.sh

# 方式二：手动分别启动
cd backend && npm run dev     # http://localhost:3000
cd web-client && npm run dev  # http://localhost:3001
cd h5-client && npm run dev   # http://localhost:3002
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run test
```

### 压力测试

```bash
# 模拟 100 个用户并发摇动
npx ts-node scripts/load-test.ts <sessionId> [serverUrl]
```

## 抽奖流程

1. PC 端创建会话，生成二维码
2. 参与者用微信扫码，完成 OAuth 授权
3. H5 端加入会话，等待抽奖开始
4. PC 端发起抽奖，设置时长和中奖人数
5. 参与者摇动手机，摇动数据实时同步到 PC 端
6. 抽奖结束，按摇动次数排名，选出中奖者

## Docker 部署

```bash
# 1. 构建所有项目
npm run build

# 2. 构建 Docker 镜像（Mac ARM → Linux amd64 需加 --platform）
docker build --platform linux/amd64 --no-cache -t qd-backend:latest ./backend
docker build --platform linux/amd64 --no-cache -t qd-web-client:latest ./web-client
docker build --platform linux/amd64 --no-cache -t qd-h5-client:latest ./h5-client

# 3. 导出镜像
docker save qd-backend:latest -o qd-backend.tar
docker save qd-web-client:latest -o qd-web-client.tar
docker save qd-h5-client:latest -o qd-h5-client.tar

# 4. 上传到服务器后加载并启动
docker load -i qd-backend.tar
docker load -i qd-web-client.tar
docker load -i qd-h5-client.tar
docker-compose down && docker-compose up -d
docker image prune -f
```

## 代码规范

- ESLint + Prettier 代码检查与格式化
- TypeScript 严格模式
- 语义化提交信息：`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (部署)

## 许可证

MIT
