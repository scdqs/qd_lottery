# Web客户端 - 公司抽奖系统

Web展示端，用于展示参与者信息、控制抽奖流程和显示结果。

## 项目结构

```
web-client/
├── src/
│   ├── components/          # React组件
│   │   ├── MainPage.tsx     # 主页面组件
│   │   ├── ParticipantList.tsx  # 参与者列表组件
│   │   ├── ShakeChart.tsx   # 实时数据图表组件
│   │   ├── WinnerDisplay.tsx    # 中奖结果组件
│   │   └── index.ts         # 组件导出
│   ├── context/             # React Context状态管理
│   │   └── LotteryContext.tsx   # 抽奖系统全局状态
│   ├── hooks/               # 自定义React Hooks
│   │   ├── useWebSocket.ts  # WebSocket连接Hook
│   │   └── index.ts
│   ├── services/            # 服务层
│   │   ├── api.ts           # HTTP API服务
│   │   └── websocket.ts     # WebSocket客户端服务
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   └── lottery.ts       # 抽奖相关工具函数
│   ├── constants/           # 常量定义
│   │   └── index.ts
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── index.html
├── package.json
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── .env.example             # 环境变量示例

## 技术栈

- **React 18+**: UI框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Socket.io-client**: WebSocket客户端
- **Chart.js + react-chartjs-2**: 数据可视化
- **QRCode.js**: 二维码生成
- **Axios**: HTTP请求
- **Jest + fast-check**: 测试框架

## 开发指南

### 安装依赖

```bash
cd web-client
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

## 状态管理

使用React Context API进行全局状态管理：

- **LotteryContext**: 管理抽奖系统的全局状态
  - sessionInfo: 会话信息
  - participants: 参与者列表
  - shakeData: 摇动数据
  - lotteryStatus: 抽奖状态
  - countdown: 倒计时
  - winners: 中奖者列表
  - error: 错误信息

## 组件说明

### MainPage
主页面组件，管理整个抽奖流程的主界面。

### ParticipantList
显示所有参与者的信息，包括头像和昵称。

### ShakeChart
实时显示参与者摇动数据的柱状图，支持动态更新和排序。

### WinnerDisplay
展示中奖者信息，包括名次、头像、昵称和摇动次数。

## API服务

### HTTP API
- `createSession()`: 创建抽奖会话
- `getSession(sessionId)`: 获取会话信息

### WebSocket事件
- 客户端发送：
  - `join-session`: 加入会话
  - `start-lottery`: 开始抽奖
- 服务器推送：
  - `participant-joined`: 新参与者加入
  - `shake-update`: 摇动数据更新
  - `lottery-result`: 中奖结果

## 开发进度

- [x] 任务7.1: 创建Web端React应用结构
- [ ] 任务7.2: 实现WebSocket客户端封装
- [ ] 任务8.1: 实现MainPage组件
- [ ] 任务9.1: 实现ParticipantList组件
- [ ] 任务10.1: 实现ShakeChart组件
- [ ] 任务11.1-11.2: 实现抽奖控制和WinnerDisplay组件
