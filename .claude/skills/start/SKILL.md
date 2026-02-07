---
name: start
description: 本地启动项目（dev模式）。当用户提到"启动项目"、"本地启动"、"本地运行"、"start"、"运行项目"时使用此技能。
---

# QD Lottery 本地开发启动

## 项目概览

Monorepo 项目，包含三个子服务，**本地开发统一使用 dev 模式**以支持热更新（HMR）：

| 服务 | 目录 | 端口 | 启动方式 | 说明 |
|------|------|------|---------|------|
| backend | `backend/` | 3000 | `npm run dev` (ts-node-dev) | 需要先构建 |
| web-client | `web-client/` | 3001 | `npx vite --port 3001` | dev 模式，支持 HMR |
| h5-client | `h5-client/` | 3002 | `npx vite --port 3002` | dev 模式，支持 HMR |

> **重要**：web-client 和 h5-client **禁止使用 `vite preview`**，必须使用 `vite`（dev 模式），否则源码修改不会实时生效。

## 执行步骤

### 第1步：检测端口运行状态

并行检测三个端口是否已在运行：

```bash
lsof -i :3000 -i :3001 -i :3002 -P 2>/dev/null | grep LISTEN
```

**对于已运行的服务，还需确认运行模式**：

```bash
ps -p <PID> -o command=
```

- web-client/h5-client 如果是 `vite preview` 模式，需要杀掉重启为 `vite` dev 模式
- 如果已经是 `vite` dev 模式，**跳过，保持运行**

**backend 额外检测**：检查 `src/` 是否比 `dist/` 有更新，决定是否需要重新构建：

```bash
if [ ! -f backend/dist/index.js ]; then echo "NEED_BUILD"; else
  find backend/src -newer backend/dist/index.js -name '*.ts' 2>/dev/null | head -1 | grep -q . && echo "NEED_BUILD" || echo "SKIP"; fi
```

### 第2步：按需构建（仅 backend）

- **backend**：如果需要构建，先杀旧进程再构建：

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
npm run build --workspace=backend
```

- **web-client / h5-client**：dev 模式无需构建，如果需要重启只需杀掉旧进程：

```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
```

### 第3步：启动未运行的服务

**只启动未运行的服务**，使用 Bash 工具的 `run_in_background` 参数并行启动：

**重要：每个服务必须在各自目录下启动**：
- **backend**：使用 `dotenv.config()` 从当前工作目录加载 `.env` 文件，从根目录启动会加载错误的 `.env`，导致 `CORS_ORIGIN` 缺失，请求报 Network Error
- **web-client / h5-client**：vite 需要从项目目录找到 `index.html` 和配置文件，从根目录启动会导致页面返回 404

```bash
# 仅启动未运行的服务，必须 cd 到各自目录
cd backend && npm run dev                  # 后台运行，仅未运行时
cd web-client && npx vite --port 3001      # 后台运行，dev 模式，支持 HMR
cd h5-client && npx vite --port 3002       # 后台运行，dev 模式，支持 HMR
```

### 第4步：验证启动状态

等待 3 秒后，读取各后台任务的输出文件，确认：
- backend 日志显示 `Server is running on port 3000`
- web-client 显示 `Local: http://localhost:3001/`
- h5-client 显示 `Local: http://localhost:3002/`

### 第5步：输出结果

向用户展示服务启动状态表格：

| 服务 | 端口 | 地址 |
|------|------|------|
| Backend | :3000 | http://localhost:3000 |
| Web Client | :3001 | http://localhost:3001 |
| H5 Client | :3002 | http://localhost:3002 |

## 注意事项

1. **web-client / h5-client 必须用 `vite` dev 模式**，禁止使用 `vite preview`，否则源码修改不会实时生效
2. **按需操作**：已运行且模式正确的服务保持不动，避免不必要的重启
3. 需要启动的服务应**并行启动**以节省时间
4. **所有服务必须从各自目录启动**：backend 从根目录启动会加载错误的 `.env` 导致跨域失败；web-client/h5-client 从根目录启动 vite 找不到 `index.html` 会返回 404
5. 使用 TodoWrite 追踪启动进度
