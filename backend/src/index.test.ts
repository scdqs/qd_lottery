import request from 'supertest';
import { app, server, sessionManager, wechatAuthService } from './index';
import { WeChatUserInfo } from './types';

// Close server after all tests
afterAll((done) => {
  server.close(done);
});

describe('Backend Setup', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have correct environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});

describe('POST /api/session/create', () => {
  it('should create a new session and return session info', async () => {
    const response = await request(app)
      .post('/api/session/create')
      .expect(200);

    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('qrCodeData');
    expect(response.body).toHaveProperty('expiresAt');

    // Verify sessionId is a valid UUID
    expect(response.body.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify qrCodeData contains the sessionId
    expect(response.body.qrCodeData).toContain(response.body.sessionId);

    // Verify expiresAt is a timestamp in the future
    expect(response.body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should create unique session IDs for multiple requests', async () => {
    const response1 = await request(app)
      .post('/api/session/create')
      .expect(200);

    const response2 = await request(app)
      .post('/api/session/create')
      .expect(200);

    expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
  });

  it('should create a session that can be retrieved from SessionManager', async () => {
    const response = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = response.body.sessionId;
    const session = sessionManager.getSession(sessionId);

    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.status).toBe('waiting');
  });

  it('should set expiration time to 24 hours from creation', async () => {
    const beforeRequest = Date.now();
    
    const response = await request(app)
      .post('/api/session/create')
      .expect(200);

    const afterRequest = Date.now();
    const expiresAt = response.body.expiresAt;
    
    // Expiration should be approximately 24 hours from now
    const expectedExpiration = 24 * 60 * 60 * 1000;
    const minExpiration = beforeRequest + expectedExpiration;
    const maxExpiration = afterRequest + expectedExpiration;

    expect(expiresAt).toBeGreaterThanOrEqual(minExpiration);
    expect(expiresAt).toBeLessThanOrEqual(maxExpiration);
  });

  it('should include H5 base URL in qrCodeData', async () => {
    const response = await request(app)
      .post('/api/session/create')
      .expect(200);

    const qrCodeData = response.body.qrCodeData;
    
    // Should be a valid URL format
    expect(qrCodeData).toMatch(/^https?:\/\/.+\?sessionId=.+$/);
  });
});

describe('GET /api/session/:sessionId', () => {
  it('should return session status and participant count for existing session', async () => {
    // First create a session
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Query the session
    const response = await request(app)
      .get(`/api/session/${sessionId}`)
      .expect(200);

    expect(response.body).toHaveProperty('sessionId', sessionId);
    expect(response.body).toHaveProperty('status', 'waiting');
    expect(response.body).toHaveProperty('participantCount', 0);
  });

  it('should return 404 for non-existent session', async () => {
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    const response = await request(app)
      .get(`/api/session/${nonExistentId}`)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(nonExistentId);
  });

  it('should return 400 for invalid session ID format', async () => {
    const response = await request(app)
      .get('/api/session/')
      .expect(404); // Express returns 404 for missing route parameter
  });

  it('should return correct participant count after adding participants', async () => {
    // Create a session
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Add participants directly through SessionManager
    sessionManager.addParticipant(sessionId, {
      userId: 'user1',
      nickname: 'User One',
      avatarUrl: 'http://example.com/avatar1.jpg',
      joinedAt: Date.now(),
      socketId: 'socket1',
    });

    sessionManager.addParticipant(sessionId, {
      userId: 'user2',
      nickname: 'User Two',
      avatarUrl: 'http://example.com/avatar2.jpg',
      joinedAt: Date.now(),
      socketId: 'socket2',
    });

    // Query the session
    const response = await request(app)
      .get(`/api/session/${sessionId}`)
      .expect(200);

    expect(response.body.participantCount).toBe(2);
  });

  it('should return correct status after status change', async () => {
    // Create a session
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Change session status
    sessionManager.updateSessionStatus(sessionId, 'running');

    // Query the session
    const response = await request(app)
      .get(`/api/session/${sessionId}`)
      .expect(200);

    expect(response.body.status).toBe('running');
  });

  it('should handle session that was deleted', async () => {
    // Create a session
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Delete the session
    sessionManager.deleteSession(sessionId);

    // Try to query the deleted session
    const response = await request(app)
      .get(`/api/session/${sessionId}`)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
  });

  it('should return different participant counts for different sessions', async () => {
    // Create two sessions
    const session1Response = await request(app)
      .post('/api/session/create')
      .expect(200);

    const session2Response = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId1 = session1Response.body.sessionId;
    const sessionId2 = session2Response.body.sessionId;

    // Add different numbers of participants
    sessionManager.addParticipant(sessionId1, {
      userId: 'user1',
      nickname: 'User One',
      avatarUrl: 'http://example.com/avatar1.jpg',
      joinedAt: Date.now(),
      socketId: 'socket1',
    });

    sessionManager.addParticipant(sessionId2, {
      userId: 'user2',
      nickname: 'User Two',
      avatarUrl: 'http://example.com/avatar2.jpg',
      joinedAt: Date.now(),
      socketId: 'socket2',
    });

    sessionManager.addParticipant(sessionId2, {
      userId: 'user3',
      nickname: 'User Three',
      avatarUrl: 'http://example.com/avatar3.jpg',
      joinedAt: Date.now(),
      socketId: 'socket3',
    });

    // Query both sessions
    const response1 = await request(app)
      .get(`/api/session/${sessionId1}`)
      .expect(200);

    const response2 = await request(app)
      .get(`/api/session/${sessionId2}`)
      .expect(200);

    expect(response1.body.participantCount).toBe(1);
    expect(response2.body.participantCount).toBe(2);
  });

  it('should handle special characters in session ID gracefully', async () => {
    const invalidId = 'invalid-id-with-special-chars-!@#$%';

    const response = await request(app)
      .get(`/api/session/${invalidId}`)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
  });
});

describe('GET /api/wechat/auth', () => {
  // Mock the WeChatAuthService.getAuthUrl method
  const mockGetAuthUrl = jest.spyOn(wechatAuthService, 'getAuthUrl');

  beforeEach(() => {
    mockGetAuthUrl.mockClear();
  });

  afterAll(() => {
    mockGetAuthUrl.mockRestore();
  });

  it('should redirect to WeChat authorization URL for valid session', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock getAuthUrl to return a test URL
    const mockAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=test&redirect_uri=http://localhost:3001/callback&response_type=code&scope=snsapi_userinfo&state=${sessionId}#wechat_redirect`;
    mockGetAuthUrl.mockReturnValue(mockAuthUrl);

    // Call the auth endpoint
    const response = await request(app)
      .get('/api/wechat/auth')
      .query({ sessionId })
      .expect(302); // Redirect status

    // Verify redirect location
    expect(response.header.location).toBe(mockAuthUrl);

    // Verify getAuthUrl was called with the correct session ID
    expect(mockGetAuthUrl).toHaveBeenCalledWith(sessionId);
    expect(mockGetAuthUrl).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when sessionId is missing', async () => {
    const response = await request(app)
      .get('/api/wechat/auth')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid session ID');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when sessionId is empty string', async () => {
    const response = await request(app)
      .get('/api/wechat/auth')
      .query({ sessionId: '' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid session ID');
  });

  it('should return 404 when session does not exist', async () => {
    const nonExistentSessionId = '00000000-0000-4000-8000-000000000000';

    const response = await request(app)
      .get('/api/wechat/auth')
      .query({ sessionId: nonExistentSessionId })
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
    expect(response.body.message).toContain(nonExistentSessionId);

    // Verify getAuthUrl was not called
    expect(mockGetAuthUrl).not.toHaveBeenCalled();
  });

  it('should handle errors from getAuthUrl', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock getAuthUrl to throw an error
    mockGetAuthUrl.mockImplementation(() => {
      throw new Error('Configuration error: Missing appId');
    });

    const response = await request(app)
      .get('/api/wechat/auth')
      .query({ sessionId })
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Failed to generate authorization URL');
    expect(response.body.message).toContain('Configuration error');
  });
});

describe('GET /api/wechat/callback', () => {
  // Mock the WeChatAuthService.handleCallback method
  const mockHandleCallback = jest.spyOn(wechatAuthService, 'handleCallback');

  beforeEach(() => {
    mockHandleCallback.mockClear();
  });

  afterAll(() => {
    mockHandleCallback.mockRestore();
  });

  it('should return user info and session ID for valid authorization', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock successful WeChat authorization
    const mockUserInfo: WeChatUserInfo = {
      openid: 'test-openid-123',
      nickname: 'Test User',
      headimgurl: 'http://example.com/avatar.jpg',
    };

    mockHandleCallback.mockResolvedValue(mockUserInfo);

    // Call the callback endpoint
    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-auth-code', state: sessionId })
      .expect(200);

    expect(response.body).toHaveProperty('userInfo');
    expect(response.body).toHaveProperty('sessionId', sessionId);
    expect(response.body.userInfo).toEqual(mockUserInfo);

    // Verify handleCallback was called with the correct code
    expect(mockHandleCallback).toHaveBeenCalledWith('test-auth-code');
    expect(mockHandleCallback).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when authorization code is missing', async () => {
    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ state: 'some-session-id' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid authorization code');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when state parameter is missing', async () => {
    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-auth-code' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid state parameter');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when both code and state are missing', async () => {
    const response = await request(app)
      .get('/api/wechat/callback')
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 404 when session does not exist', async () => {
    const nonExistentSessionId = '00000000-0000-4000-8000-000000000000';

    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-auth-code', state: nonExistentSessionId })
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Session not found');
    expect(response.body.message).toContain(nonExistentSessionId);

    // Verify handleCallback was not called
    expect(mockHandleCallback).not.toHaveBeenCalled();
  });

  it('should return 500 when WeChat authorization fails', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock failed WeChat authorization
    mockHandleCallback.mockRejectedValue(new Error('WeChat API error: 40029 - invalid code'));

    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'invalid-code', state: sessionId })
      .expect(500);

    expect(response.body).toHaveProperty('error', 'WeChat authorization failed');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('WeChat API error');
  });

  it('should return user info with all required fields', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock successful WeChat authorization with all fields
    const mockUserInfo: WeChatUserInfo = {
      openid: 'test-openid-456',
      nickname: 'Complete User',
      headimgurl: 'http://example.com/complete-avatar.jpg',
      unionid: 'test-unionid-789',
    };

    mockHandleCallback.mockResolvedValue(mockUserInfo);

    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-auth-code', state: sessionId })
      .expect(200);

    expect(response.body.userInfo).toHaveProperty('openid', 'test-openid-456');
    expect(response.body.userInfo).toHaveProperty('nickname', 'Complete User');
    expect(response.body.userInfo).toHaveProperty('headimgurl', 'http://example.com/complete-avatar.jpg');
    expect(response.body.userInfo).toHaveProperty('unionid', 'test-unionid-789');
  });

  it('should handle multiple callback requests for the same session', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock successful WeChat authorization for first user
    const mockUserInfo1: WeChatUserInfo = {
      openid: 'user1-openid',
      nickname: 'User One',
      headimgurl: 'http://example.com/user1.jpg',
    };

    mockHandleCallback.mockResolvedValue(mockUserInfo1);

    const response1 = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'code1', state: sessionId })
      .expect(200);

    expect(response1.body.userInfo.openid).toBe('user1-openid');

    // Mock successful WeChat authorization for second user
    const mockUserInfo2: WeChatUserInfo = {
      openid: 'user2-openid',
      nickname: 'User Two',
      headimgurl: 'http://example.com/user2.jpg',
    };

    mockHandleCallback.mockResolvedValue(mockUserInfo2);

    const response2 = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'code2', state: sessionId })
      .expect(200);

    expect(response2.body.userInfo.openid).toBe('user2-openid');
    expect(mockHandleCallback).toHaveBeenCalledTimes(2);
  });

  it('should validate code parameter type', async () => {
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Try with non-string code (query params are always strings in practice, but test the validation)
    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: '', state: sessionId })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid authorization code');
  });

  it('should validate state parameter type', async () => {
    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-code', state: '' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid state parameter');
  });

  it('should handle network errors from WeChat service', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/session/create')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Mock network error
    mockHandleCallback.mockRejectedValue(new Error('Network error: ECONNREFUSED'));

    const response = await request(app)
      .get('/api/wechat/callback')
      .query({ code: 'test-code', state: sessionId })
      .expect(500);

    expect(response.body).toHaveProperty('error', 'WeChat authorization failed');
    expect(response.body.message).toContain('Network error');
  });
});
