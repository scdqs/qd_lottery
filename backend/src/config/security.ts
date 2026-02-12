/**
 * Security Configuration Module
 * Handles HTTPS, CORS, and security headers configuration
 */

import { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = Logger.create('Security');

/**
 * CORS configuration
 * Allows requests from specified origins with credentials
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // In test environment, allow all origins
    if (process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }

    // Get allowed origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

    // Allow requests with no origin (browser direct access, mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (allowedOrigins.includes('*')) {
      // Allow all origins if wildcard is specified (not recommended for production)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

/**
 * Security headers middleware
 * Adds security-related HTTP headers to all responses
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' ws: wss:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'none';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  next();
};

/**
 * HTTPS configuration for production
 * Returns SSL options if certificates are available
 */
export const getHttpsOptions = () => {
  const fs = require('fs');
  const path = require('path');
  
  // Only use HTTPS in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  
  try {
    const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt';
    const keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key';
    const caPath = process.env.SSL_CA_PATH;
    
    // Check if certificate files exist
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      logger.info('未挂载SSL证书，以HTTP模式运行（SSL由反向代理处理）');
      return null;
    }
    
    const options: any = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    
    // Add CA certificate if provided
    if (caPath && fs.existsSync(caPath)) {
      options.ca = fs.readFileSync(caPath);
    }
    
    return options;
  } catch (error) {
    logger.error('加载SSL证书失败', error);
    return null;
  }
};

/**
 * Force HTTPS redirect middleware
 * Redirects HTTP requests to HTTPS in production
 */
export const forceHttpsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is already secure or proxied through HTTPS
    const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
    
    if (!isSecure) {
      // Only redirect if the request is truly coming from HTTP
      // Skip if it's coming from the internal proxy (which may use HTTP internally)
      const forwardedHost = req.get('x-forwarded-host');
      const isInternal = !forwardedHost;
      
      if (!isInternal) {
        return res.redirect(301, `https://${req.get('host')}${req.url}`);
      }
    }
  }
  next();
};

/**
 * Rate limiting configuration
 * Helps prevent abuse and DDoS attacks
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};
