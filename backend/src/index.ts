import express from 'express';
import http from 'http';
import https from 'https';
import cors from 'cors';
import dotenv from 'dotenv';
import { SessionManager } from './SessionManager';
import { SessionCleanupService } from './SessionCleanupService';
import { setupWebSocketServer } from './websocket';
import { WeChatAuthService } from './WeChatAuthService';
import {
  corsOptions,
  securityHeadersMiddleware,
  forceHttpsMiddleware,
  getHttpsOptions,
} from './config/security';

// Load environment variables
dotenv.config();

const app = express();

// Get HTTPS options if available
const httpsOptions = getHttpsOptions();

// Create server (HTTPS in production if certificates available, HTTP otherwise)
const server = httpsOptions
  ? https.createServer(httpsOptions, app)
  : http.createServer(app);

// Initialize SessionManager
const sessionManager = new SessionManager();

// Initialize SessionCleanupService
const cleanupIntervalMs = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000', 10); // 1 hour
const sessionExpiryMs = parseInt(process.env.SESSION_EXPIRY_TIME || '86400000', 10); // 24 hours
const sessionCleanupService = new SessionCleanupService(
  sessionManager,
  cleanupIntervalMs,
  sessionExpiryMs
);

// Start cleanup service (not in test environment)
if (process.env.NODE_ENV !== 'test') {
  sessionCleanupService.start();
}

// Initialize WeChatAuthService
const wechatAuthService = new WeChatAuthService();

// Initialize WebSocket server
const io = setupWebSocketServer(server, sessionManager);

// Security Middleware (must be first)
app.use(forceHttpsMiddleware);
app.use(securityHeadersMiddleware);

// CORS Middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Admin endpoint: Get cleanup statistics
app.get('/api/admin/cleanup/stats', (_req, res) => {
  try {
    const stats = sessionCleanupService.getStats();
    res.json({
      ...stats,
      cleanupServiceRunning: sessionCleanupService.isRunning(),
      cleanupInterval: cleanupIntervalMs,
      sessionExpiry: sessionExpiryMs,
    });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({
      error: 'Failed to get cleanup statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Admin endpoint: Trigger manual cleanup
app.post('/api/admin/cleanup/run', (_req, res) => {
  try {
    const deletedCount = sessionCleanupService.cleanup();
    res.json({
      success: true,
      deletedCount,
      message: `Cleanup completed: ${deletedCount} session(s) deleted`,
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({
      error: 'Failed to run cleanup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Admin endpoint: Cleanup finished sessions
app.post('/api/admin/cleanup/finished', (_req, res) => {
  try {
    const deletedCount = sessionCleanupService.cleanupFinishedSessions();
    res.json({
      success: true,
      deletedCount,
      message: `Finished session cleanup: ${deletedCount} session(s) deleted`,
    });
  } catch (error) {
    console.error('Error cleaning up finished sessions:', error);
    res.status(500).json({
      error: 'Failed to cleanup finished sessions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Session creation endpoint
app.post('/api/session/create', (_req, res) => {
  try {
    const session = sessionManager.createSession();
    
    // Generate QR code data (URL for H5 client to join)
    const h5BaseUrl = process.env.H5_BASE_URL || 'http://localhost:5173';
    const qrCodeData = `${h5BaseUrl}?sessionId=${session.id}`;
    
    // Calculate expiration time (24 hours from creation)
    const expiresAt = session.createdAt + 24 * 60 * 60 * 1000;
    
    res.json({
      sessionId: session.id,
      qrCodeData,
      expiresAt,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Session query endpoint
app.get('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate sessionId parameter
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Invalid session ID',
        message: 'Session ID is required and must be a string',
      });
    }
    
    // Get session from SessionManager
    const session = sessionManager.getSession(sessionId);
    
    // Handle session not found
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session with ID ${sessionId} does not exist or has been deleted`,
      });
    }
    
    // Return session status and participant count
    res.json({
      sessionId: session.id,
      status: session.status,
      participantCount: session.participants.size,
    });
  } catch (error) {
    console.error('Error querying session:', error);
    res.status(500).json({
      error: 'Failed to query session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// WeChat authorization URL generation endpoint
app.get('/api/wechat/auth', (req, res) => {
  try {
    const { sessionId } = req.query;
    
    // Validate sessionId parameter
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Invalid session ID',
        message: 'Session ID is required and must be a string',
      });
    }
    
    // Verify session exists
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session with ID ${sessionId} does not exist or has been deleted`,
      });
    }
    
    // Generate WeChat authorization URL
    const authUrl = wechatAuthService.getAuthUrl(sessionId);
    
    // Redirect to WeChat authorization page
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// WeChat authorization callback endpoint
app.get('/api/wechat/callback', async (req, res) => {
  // H5 client base URL for redirects
  const h5BaseUrl = process.env.H5_BASE_URL || 'http://localhost:5173';

  try {
    const { code, state } = req.query;

    // Validate required parameters
    if (!code || typeof code !== 'string') {
      const errorMsg = encodeURIComponent('授权码无效');
      return res.redirect(`${h5BaseUrl}?error=${errorMsg}`);
    }

    if (!state || typeof state !== 'string') {
      const errorMsg = encodeURIComponent('会话参数无效');
      return res.redirect(`${h5BaseUrl}?error=${errorMsg}`);
    }

    const sessionId = state;

    // Verify session exists
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      const errorMsg = encodeURIComponent('会话不存在或已过期');
      return res.redirect(`${h5BaseUrl}?sessionId=${sessionId}&error=${errorMsg}`);
    }

    // Handle authorization callback and get user info
    const userInfo = await wechatAuthService.handleCallback(code);

    // Encode user info as base64 to pass via URL
    const userInfoBase64 = Buffer.from(JSON.stringify(userInfo)).toString('base64');

    // Redirect back to H5 client with user info
    res.redirect(`${h5BaseUrl}?sessionId=${sessionId}&userInfo=${userInfoBase64}`);
  } catch (error) {
    console.error('Error handling WeChat callback:', error);
    const errorMsg = encodeURIComponent(error instanceof Error ? error.message : '微信授权失败');
    const sessionId = req.query.state as string;
    const redirectUrl = sessionId
      ? `${h5BaseUrl}?sessionId=${sessionId}&error=${errorMsg}`
      : `${h5BaseUrl}?error=${errorMsg}`;
    res.redirect(redirectUrl);
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Session cleanup interval: ${cleanupIntervalMs}ms`);
  console.log(`Session expiry time: ${sessionExpiryMs}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  sessionCleanupService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  sessionCleanupService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export { app, server, sessionManager, sessionCleanupService, io, wechatAuthService };
