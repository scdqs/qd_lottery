# QD Shake - Real-Time Interactive Lottery System

A real-time interactive lottery platform based on WeChat authorization. Participants compete by shaking their phones — the one who shakes the most wins.

## Project Structure

Monorepo architecture:

```
qd_lottery/
├── backend/                # Backend service (Express + Socket.IO)
│   ├── src/
│   │   ├── index.ts                  # Entry point, HTTP routes
│   │   ├── websocket.ts              # WebSocket real-time communication
│   │   ├── SessionManager.ts         # Session management
│   │   ├── SessionCleanupService.ts  # Automatic session cleanup
│   │   ├── WeChatAuthService.ts      # WeChat OAuth authorization
│   │   ├── config/
│   │   │   └── security.ts           # Security config (CORS/CSP/HSTS)
│   │   └── utils/
│   │       └── logger.ts             # Logging utility
│   └── Dockerfile
├── web-client/             # PC admin dashboard (React + Vite)
│   ├── nginx.conf
│   └── Dockerfile
├── h5-client/              # H5 mobile client (React + Vite)
│   ├── nginx.conf
│   └── Dockerfile
├── scripts/
│   ├── dev.sh              # Local dev startup script
│   └── load-test.ts        # Load testing script
├── docker-compose.yml      # Docker orchestration
└── package.json            # Monorepo root config
```

## Key Features

- WeChat OAuth 2.0 login
- Real-time shake data sync via WebSocket
- Configurable winner count
- Session lifecycle management with auto-cleanup
- Live participant and shake data display on PC
- Shake interaction on H5 mobile (dark festive theme)
- Security hardening (CORS, CSP, HSTS, clickjacking protection)

## Tech Stack

### Backend
- Node.js 18+ / Express / TypeScript
- Socket.IO (WebSocket real-time communication)
- Jest + fast-check (testing)

### Web Client (PC Dashboard)
- React 18+ / TypeScript / Vite
- Socket.IO-client / Chart.js / QRCode.js

### H5 Client (Mobile)
- React 18+ / TypeScript / Vite
- Socket.IO-client / Axios

### Deployment
- Docker Compose (three-service orchestration)
- Nginx (static assets + reverse proxy + SSL)

## Quick Start

### Install Dependencies

```bash
npm run install:all
```

### Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your WeChat Open Platform credentials

# Clients (optional, defaults to localhost:3000)
# web-client/.env.development
# h5-client/.env.development
```

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `3000` |
| `WECHAT_APP_ID` | WeChat AppID | - |
| `WECHAT_APP_SECRET` | WeChat AppSecret | - |
| `WECHAT_REDIRECT_URI` | WeChat OAuth callback URL | - |
| `H5_BASE_URL` | H5 client URL | `http://localhost:5173` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3001,http://localhost:5173` |
| `SESSION_CLEANUP_INTERVAL` | Cleanup interval (ms) | `3600000` (1 hour) |
| `SESSION_EXPIRY_TIME` | Session expiry (ms) | `86400000` (24 hours) |

### Local Development

```bash
# Option 1: Use the startup script (recommended, starts all 3 services in parallel)
bash scripts/dev.sh

# Option 2: Start each service manually
cd backend && npm run dev     # http://localhost:3000
cd web-client && npm run dev  # http://localhost:3001
cd h5-client && npm run dev   # http://localhost:3002
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Load Testing

```bash
# Simulate 100 concurrent users shaking
npx ts-node scripts/load-test.ts <sessionId> [serverUrl]
```

## Lottery Flow

1. PC dashboard creates a session and generates a QR code
2. Participants scan the QR code with WeChat and complete OAuth authorization
3. H5 client joins the session and waits for the lottery to start
4. PC dashboard starts the lottery, setting duration and winner count
5. Participants shake their phones; shake data syncs to the PC in real time
6. Lottery ends, winners are selected by shake count ranking

## Docker Deployment

```bash
# 1. Build all projects
npm run build

# 2. Build Docker images (add --platform for Mac ARM → Linux amd64)
docker build --platform linux/amd64 --no-cache -t qd-backend:latest ./backend
docker build --platform linux/amd64 --no-cache -t qd-web-client:latest ./web-client
docker build --platform linux/amd64 --no-cache -t qd-h5-client:latest ./h5-client

# 3. Export images
docker save qd-backend:latest -o qd-backend.tar
docker save qd-web-client:latest -o qd-web-client.tar
docker save qd-h5-client:latest -o qd-h5-client.tar

# 4. Load and start on the server
docker load -i qd-backend.tar
docker load -i qd-web-client.tar
docker load -i qd-h5-client.tar
docker-compose down && docker-compose up -d
docker image prune -f
```

## Code Standards

- ESLint + Prettier for linting and formatting
- TypeScript strict mode
- Semantic commit messages: `feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (for deployment)

## License

MIT
