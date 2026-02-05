# Company Lottery System

A real-time interactive lottery platform based on WeChat authorization, using a "shake" game mechanism to select winners.

## Project Structure

This project uses a monorepo structure with three sub-projects:

```
company-lottery-system/
├── backend/          # Backend service (Node.js + Express + Socket.io)
├── web-client/       # Web display client (React + TypeScript)
├── h5-client/        # H5 mobile client (React + TypeScript)
└── package.json      # Root configuration file
```

## Tech Stack

### Backend (backend)
- Node.js 18+
- Express (HTTP server)
- Socket.io (WebSocket real-time communication)
- TypeScript
- Jest + fast-check (testing framework)

### Web Client (web-client)
- React 18+
- TypeScript
- Socket.io-client (WebSocket client)
- Chart.js (data visualization)
- QRCode.js (QR code generation)
- Vite (build tool)

### H5 Client (h5-client)
- React 18+
- TypeScript
- Socket.io-client (WebSocket client)
- Vite (build tool)

## Quick Start

### Install Dependencies

```bash
# Install dependencies for all sub-projects
npm run install:all
```

### Development Environment

1. Configure backend environment variables:

```bash
cd backend
cp .env.example .env
# Edit the .env file and fill in your WeChat Open Platform configuration
```

2. Start the backend service:

```bash
cd backend
npm run dev
```

The backend service will run at http://localhost:3000

3. Start the web client:

```bash
cd web-client
npm run dev
```

The web client will run at http://localhost:3001

4. Start the H5 client:

```bash
cd h5-client
npm run dev
```

The H5 client will run at http://localhost:3002

### Build for Production

```bash
# Build all sub-projects
npm run build
```

### Run Tests

```bash
# Run all tests
npm run test

# Run tests for specific sub-project
cd backend && npm run test
cd web-client && npm run test
cd h5-client && npm run test
```

### Code Linting and Formatting

```bash
# Check code style
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Development Guidelines

### Code Style

- Use ESLint for code linting
- Use Prettier for code formatting
- Follow TypeScript strict mode

### Testing Strategy

This project adopts a dual testing approach:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Use fast-check to verify general properties

### Commit Convention

We recommend using semantic commit messages:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code formatting adjustment
- `refactor:` Refactoring
- `test:` Test-related
- `chore:` Build/tooling-related

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## License

MIT
