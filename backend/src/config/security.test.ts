/**
 * Security Configuration Tests
 */

import { Request, Response } from 'express';
import { corsOptions, securityHeadersMiddleware, forceHttpsMiddleware } from './security';

describe('Security Configuration', () => {
  describe('CORS Options', () => {
    it('should allow requests from allowed origins', (done) => {
      process.env.CORS_ORIGIN = 'http://localhost:3001,http://localhost:5173';
      
      const origin = 'http://localhost:3001';
      const callback = (error: Error | null, allow?: any) => {
        expect(error).toBeNull();
        expect(allow).toBe(true);
        done();
      };
      
      if (corsOptions.origin && typeof corsOptions.origin === 'function') {
        corsOptions.origin(origin, callback as any);
      }
    });

    it('should reject requests from non-allowed origins', (done) => {
      process.env.CORS_ORIGIN = 'http://localhost:3001';
      process.env.NODE_ENV = 'production';
      
      const origin = 'http://malicious-site.com';
      const callback = (error: Error | null, allow?: any) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Not allowed by CORS');
        done();
      };
      
      if (corsOptions.origin && typeof corsOptions.origin === 'function') {
        corsOptions.origin(origin, callback as any);
      }
    });

    it('should allow requests with no origin in development', (done) => {
      process.env.NODE_ENV = 'development';
      process.env.CORS_ORIGIN = 'http://localhost:3001';
      
      const origin = undefined;
      const callback = (error: Error | null, allow?: any) => {
        expect(error).toBeNull();
        expect(allow).toBe(true);
        done();
      };
      
      if (corsOptions.origin && typeof corsOptions.origin === 'function') {
        corsOptions.origin(origin, callback as any);
      }
    });

    it('should allow all origins when wildcard is specified', (done) => {
      process.env.CORS_ORIGIN = '*';
      
      const origin = 'http://any-site.com';
      const callback = (error: Error | null, allow?: any) => {
        expect(error).toBeNull();
        expect(allow).toBe(true);
        done();
      };
      
      if (corsOptions.origin && typeof corsOptions.origin === 'function') {
        corsOptions.origin(origin, callback as any);
      }
    });
  });

  describe('Security Headers Middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let nextFn: jest.Mock;
    let setHeaderSpy: jest.Mock;

    beforeEach(() => {
      setHeaderSpy = jest.fn();
      mockReq = {
        secure: false,
      };
      mockRes = {
        setHeader: setHeaderSpy,
      };
      nextFn = jest.fn();
    });

    it('should set all required security headers', () => {
      process.env.NODE_ENV = 'development';
      
      securityHeadersMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(setHeaderSpy).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(setHeaderSpy).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(setHeaderSpy).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(nextFn).toHaveBeenCalled();
    });

    it('should set HSTS header in production with HTTPS', () => {
      process.env.NODE_ENV = 'production';
      mockReq.secure = true;
      
      securityHeadersMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    });

    it('should not set HSTS header in development', () => {
      process.env.NODE_ENV = 'development';
      mockReq.secure = true;
      
      securityHeadersMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(setHeaderSpy).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String)
      );
    });
  });

  describe('Force HTTPS Middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let nextFn: jest.Mock;
    let redirectSpy: jest.Mock;

    beforeEach(() => {
      redirectSpy = jest.fn();
      mockReq = {
        secure: false,
        get: jest.fn((header: string) => {
          if (header === 'host') return 'example.com';
          if (header === 'x-forwarded-proto') return undefined;
          return undefined;
        }),
        url: '/api/test',
      };
      mockRes = {
        redirect: redirectSpy,
      };
      nextFn = jest.fn();
    });

    it('should redirect to HTTPS in production when request is not secure', () => {
      process.env.NODE_ENV = 'production';
      mockReq.secure = false;
      
      forceHttpsMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(redirectSpy).toHaveBeenCalledWith(301, 'https://example.com/api/test');
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should not redirect when request is already secure', () => {
      process.env.NODE_ENV = 'production';
      mockReq.secure = true;
      
      forceHttpsMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(redirectSpy).not.toHaveBeenCalled();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should not redirect in development', () => {
      process.env.NODE_ENV = 'development';
      mockReq.secure = false;
      
      forceHttpsMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(redirectSpy).not.toHaveBeenCalled();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should not redirect when x-forwarded-proto is https', () => {
      process.env.NODE_ENV = 'production';
      mockReq.secure = false;
      mockReq.get = jest.fn((header: string) => {
        if (header === 'x-forwarded-proto') return 'https';
        if (header === 'host') return 'example.com';
        return undefined;
      });
      
      forceHttpsMiddleware(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );

      expect(redirectSpy).not.toHaveBeenCalled();
      expect(nextFn).toHaveBeenCalled();
    });
  });
});
