# Security and Data Protection Features

This document describes the security and data protection features implemented in the lottery system backend.

## 1. HTTPS and SSL/TLS Configuration

### Overview
The backend server supports HTTPS encryption for secure data transmission in production environments.

### Configuration

#### Environment Variables
Add the following to your `.env` file for production:

```bash
NODE_ENV=production
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt  # Optional
```

#### Certificate Setup
1. **Development**: The server runs on HTTP by default
2. **Production**: Place SSL certificates in the specified paths
   - Server certificate: `SSL_CERT_PATH`
   - Private key: `SSL_KEY_PATH`
   - CA bundle (optional): `SSL_CA_PATH`

#### Automatic HTTPS Redirect
In production mode, all HTTP requests are automatically redirected to HTTPS (301 redirect).

## 2. CORS Configuration

### Overview
Cross-Origin Resource Sharing (CORS) is configured to allow requests only from trusted origins.

### Configuration

#### Environment Variables
```bash
CORS_ORIGIN=https://example.com,https://app.example.com
```

#### Features
- **Origin Validation**: Only requests from allowed origins are accepted
- **Credentials Support**: Cookies and authentication headers are supported
- **Development Mode**: Requests with no origin are allowed in development
- **Wildcard Support**: Use `*` to allow all origins (not recommended for production)

### Allowed Methods
- GET
- POST
- PUT
- DELETE
- OPTIONS

### Allowed Headers
- Content-Type
- Authorization
- X-Requested-With

## 3. Security Headers

The following security headers are automatically added to all responses:

### X-Frame-Options
```
X-Frame-Options: DENY
```
Prevents clickjacking attacks by disabling iframe embedding.

### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME type sniffing.

### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Enables browser XSS protection.

### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Forces HTTPS connections for 1 year. Only enabled in production with HTTPS.

### Content-Security-Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```
Restricts resource loading to prevent XSS and data injection attacks.

### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls referrer information sent with requests.

### Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```
Disables unnecessary browser features.

## 4. Session Data Cleanup

### Overview
The SessionCleanupService automatically removes expired and finished sessions to protect user privacy and free up memory.

### Configuration

#### Environment Variables
```bash
SESSION_CLEANUP_INTERVAL=3600000  # 1 hour in milliseconds
SESSION_EXPIRY_TIME=86400000      # 24 hours in milliseconds
```

### Cleanup Strategies

#### 1. Automatic Scheduled Cleanup
- Runs at regular intervals (default: every 1 hour)
- Deletes sessions older than the expiry time (default: 24 hours)
- Starts automatically when the server starts

#### 2. Finished Session Cleanup
- Sessions marked as 'finished' can be cleaned up immediately
- Triggered manually via API or automatically during scheduled cleanup

### Data Deletion
When a session is deleted, all associated data is removed:
- Participant information (userId, nickname, avatarUrl)
- Shake data (shake counts)
- WebSocket client connections
- Session metadata

### Admin API Endpoints

#### Get Cleanup Statistics
```bash
GET /api/admin/cleanup/stats
```

Response:
```json
{
  "totalSessions": 5,
  "expiredSessions": 2,
  "finishedSessions": 1,
  "cleanupServiceRunning": true,
  "cleanupInterval": 3600000,
  "sessionExpiry": 86400000
}
```

#### Trigger Manual Cleanup
```bash
POST /api/admin/cleanup/run
```

Response:
```json
{
  "success": true,
  "deletedCount": 2,
  "message": "Cleanup completed: 2 session(s) deleted"
}
```

#### Cleanup Finished Sessions
```bash
POST /api/admin/cleanup/finished
```

Response:
```json
{
  "success": true,
  "deletedCount": 1,
  "message": "Finished session cleanup: 1 session(s) deleted"
}
```

## 5. Graceful Shutdown

The server handles shutdown signals gracefully:

### SIGTERM / SIGINT
When the server receives a shutdown signal:
1. Stops the cleanup service
2. Closes the HTTP/HTTPS server
3. Allows existing connections to complete

### Implementation
```typescript
process.on('SIGTERM', () => {
  sessionCleanupService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});
```

## 6. Best Practices

### Production Deployment

1. **Use HTTPS**: Always use SSL/TLS certificates in production
2. **Restrict CORS**: Only allow trusted origins
3. **Monitor Cleanup**: Check cleanup statistics regularly
4. **Adjust Timings**: Configure cleanup interval and expiry time based on your needs
5. **Secure Admin Endpoints**: Add authentication to admin endpoints in production

### Development

1. **HTTP is OK**: HTTP is acceptable for local development
2. **Relaxed CORS**: Use wildcard or localhost origins
3. **Shorter Expiry**: Use shorter expiry times for testing

### Security Checklist

- [ ] SSL certificates installed and configured
- [ ] CORS origins restricted to trusted domains
- [ ] Admin endpoints protected with authentication
- [ ] Session cleanup service running
- [ ] Security headers verified
- [ ] HTTPS redirect enabled in production
- [ ] Graceful shutdown handlers configured

## 7. Testing

### Security Configuration Tests
```bash
npm test -- src/config/security.test.ts
```

### Session Cleanup Tests
```bash
npm test -- src/SessionCleanupService.test.ts
```

### Integration Tests
```bash
npm test
```

## 8. Monitoring

### Logs
The server logs important security and cleanup events:
- Session cleanup operations
- Expired session deletions
- Finished session deletions
- SSL certificate loading
- CORS violations

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## 9. Troubleshooting

### SSL Certificate Issues
- **Error**: "SSL certificates not found"
- **Solution**: Verify certificate paths in environment variables

### CORS Errors
- **Error**: "Not allowed by CORS"
- **Solution**: Add the origin to `CORS_ORIGIN` environment variable

### Cleanup Not Running
- **Check**: Call `/api/admin/cleanup/stats` to verify service status
- **Solution**: Restart the server if cleanup service is not running

## 10. References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)
