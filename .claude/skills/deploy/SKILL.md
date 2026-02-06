---
name: deploy
description: 构建项目并部署到服务器。当用户提到"部署"、"发布"、"上线"、"deploy"、"构建并部署"时使用此技能。
---

# QD Lottery 项目构建与部署

## 项目概览

Monorepo 项目，包含三个子服务：

| 服务 | 目录 | 技术栈 | 容器端口 | Dockerfile |
|------|------|--------|---------|-----------|
| backend | `backend/` | Express + Socket.IO (Node 18) | 3000 | `backend/Dockerfile` (node:18-alpine) |
| web-client | `web-client/` | React + Vite (Nginx) | 3001→80 | `web-client/Dockerfile` (nginx:alpine) |
| h5-client | `h5-client/` | React + Vite (Nginx) | 3002→80 | `h5-client/Dockerfile` (nginx:alpine) |

## 服务器信息

- 地址: 81.70.71.102 (SSH 连接名: default)
- 系统: CentOS 7, **linux/amd64** 架构
- 部署路径: `/root/qd_lottery/`
- Docker Compose 配置: `docker-compose.yml`

## 域名

- API: https://api.lottery.flutterbbs.cn → 127.0.0.1:3000
- PC 展示端: https://pc.lottery.flutterbbs.cn → 127.0.0.1:3001
- H5 移动端: https://h5.lottery.flutterbbs.cn → 127.0.0.1:3002

## 部署步骤（严格按顺序执行）

### 第0步：检测变更范围（关键）

部署前**必须**先判断哪些服务有代码变更，**只构建和部署有变更的服务**，避免不必要的构建和上传。

检测方法：通过 `git status` 和 `git diff` 查看变更文件，根据文件路径判断涉及的服务：

| 变更路径 | 影响的服务 | 镜像名 |
|---------|-----------|--------|
| `backend/` | backend | qd_lottery-backend |
| `web-client/` | web-client | qd_lottery-web-client |
| `h5-client/` | h5-client | qd_lottery-h5-client |
| `docker-compose.yml` | 所有服务（需重新上传配置） | - |
| `package.json`（根目录） | 可能影响所有服务 | 视情况判断 |

**判断规则**：
- 如果用户明确指定了要部署的服务，按用户指定的来
- 如果用户说"部署项目"但未指定，通过 git 变更自动判断
- 只有变更目录对应的服务才需要：构建镜像 → 导出 tar → 上传 → 加载
- 未变更的服务**跳过构建和上传**，服务器上直接复用现有镜像

### 第1步：本地构建项目

```bash
npm run build
```

此命令会构建所有 workspaces（backend、web-client、h5-client），产物分别在各自的 `dist/` 目录。

### 第2步：构建有变更的 Docker 镜像（linux/amd64 平台）

**关键**: 本机是 Mac ARM 架构，服务器是 amd64，**必须**加 `--platform linux/amd64`，否则会出现 `exec format error`。

**只构建有变更的服务镜像**，可并行构建：

```bash
# 仅在 backend/ 有变更时执行
docker build --platform linux/amd64 --no-cache -t qd_lottery-backend:latest ./backend

# 仅在 web-client/ 有变更时执行
docker build --platform linux/amd64 --no-cache -t qd_lottery-web-client:latest ./web-client

# 仅在 h5-client/ 有变更时执行
docker build --platform linux/amd64 --no-cache -t qd_lottery-h5-client:latest ./h5-client
```

### 第3步：导出有变更的镜像为 tar 文件

**只导出有变更的服务镜像**，可并行执行：

```bash
# 仅导出有变更的镜像
docker save qd_lottery-backend:latest -o qd_lottery-backend.tar
docker save qd_lottery-web-client:latest -o qd_lottery-web-client.tar
docker save qd_lottery-h5-client:latest -o qd_lottery-h5-client.tar
```

### 第4步：上传到服务器

通过 SSH MCP 工具**只上传有变更的镜像** tar 文件到 `/root/qd_lottery/`，可并行上传。

如果 `docker-compose.yml` 有变更，也需要一并上传。

### 第5步：服务器上加载镜像并重启

通过 SSH MCP 在服务器上执行，**只加载有变更的镜像**：

```bash
cd /root/qd_lottery

# 仅加载有变更的镜像
docker load -i qd_lottery-backend.tar      # 仅 backend 有变更时
docker load -i qd_lottery-web-client.tar   # 仅 web-client 有变更时
docker load -i qd_lottery-h5-client.tar    # 仅 h5-client 有变更时

# 停止旧容器 → 启动新容器
docker-compose down
docker-compose up -d
```

### 第6步：验证部署

```bash
cd /root/qd_lottery && docker-compose ps && docker-compose logs --tail=10
```

检查：
- 三个容器状态都是 `Up`（非 `Restarting`）
- 日志中**没有** `exec format error`
- backend 日志显示 `Server is running on port 3000`
- web-client 和 h5-client 日志显示 nginx 正常启动

### 第7步：清理旧镜像

```bash
docker image prune -f
```

## 注意事项

1. **按需部署**: 先检测变更范围，只构建/上传/部署有变更的服务，节省时间和带宽
2. **平台架构**: 永远记住用 `--platform linux/amd64`，这是最常见的部署失败原因
3. **并行优化**: 第2、3、4步中的独立操作应尽量并行执行以节省时间
4. **docker-compose.yml 版本警告**: `version` 字段已过时的警告可忽略，不影响运行
5. **使用 TodoWrite 追踪进度**: 部署过程较长，用 todo list 跟踪每一步的进度
