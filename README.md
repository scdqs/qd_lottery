# 公司抽奖系统

基于微信授权的实时互动抽奖平台，通过"摇一摇"游戏机制选出中奖者。

## 项目结构

本项目采用 monorepo 结构，包含三个子项目：

```
company-lottery-system/
├── backend/          # 后端服务 (Node.js + Express + Socket.io)
├── web-client/       # Web展示端 (React + TypeScript)
├── h5-client/        # H5移动端 (React + TypeScript)
└── package.json      # 根配置文件
```

## 技术栈

### 后端 (backend)
- Node.js 18+
- Express (HTTP服务器)
- Socket.io (WebSocket实时通信)
- TypeScript
- Jest + fast-check (测试框架)

### Web端 (web-client)
- React 18+
- TypeScript
- Socket.io-client (WebSocket客户端)
- Chart.js (数据可视化)
- QRCode.js (二维码生成)
- Vite (构建工具)

### H5端 (h5-client)
- React 18+
- TypeScript
- Socket.io-client (WebSocket客户端)
- Vite (构建工具)

## 快速开始

### 安装依赖

```bash
# 安装所有子项目的依赖
npm run install:all
```

### 开发环境

1. 配置后端环境变量：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入微信开放平台的配置
```

2. 启动后端服务：

```bash
cd backend
npm run dev
```

后端服务将运行在 http://localhost:3000

3. 启动Web端：

```bash
cd web-client
npm run dev
```

Web端将运行在 http://localhost:3001

4. 启动H5端：

```bash
cd h5-client
npm run dev
```

H5端将运行在 http://localhost:3002

### 构建生产版本

```bash
# 构建所有子项目
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行特定子项目的测试
cd backend && npm run test
cd web-client && npm run test
cd h5-client && npm run test
```

### 代码检查和格式化

```bash
# 检查代码风格
npm run lint

# 格式化代码
npm run format

# 检查格式
npm run format:check
```

## 开发规范

### 代码风格

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式

### 测试策略

本项目采用双重测试方法：

1. **单元测试**：验证特定示例和边缘情况
2. **属性测试**：使用 fast-check 验证通用属性

### 提交规范

建议使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 许可证

MIT
