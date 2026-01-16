import { WeChatAuthService } from './WeChatAuthService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeChatAuthService', () => {
  let service: WeChatAuthService;
  const mockAppId = 'test_app_id';
  const mockAppSecret = 'test_app_secret';
  const mockRedirectUri = 'http://localhost:3000/api/wechat/callback';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create service instance with test credentials
    service = new WeChatAuthService(mockAppId, mockAppSecret, mockRedirectUri);
  });

  describe('getAuthUrl', () => {
    it('should generate correct WeChat authorization URL', () => {
      const sessionId = 'test-session-123';
      const authUrl = service.getAuthUrl(sessionId);

      // Verify URL structure
      expect(authUrl).toContain('https://open.weixin.qq.com/connect/oauth2/authorize');
      expect(authUrl).toContain(`appid=${mockAppId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(mockRedirectUri)}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=snsapi_userinfo');
      expect(authUrl).toContain(`state=${sessionId}`);
      expect(authUrl).toContain('#wechat_redirect');
    });

    it('should include sessionId as state parameter', () => {
      const sessionId = 'session-abc-123';
      const authUrl = service.getAuthUrl(sessionId);

      expect(authUrl).toContain(`state=${sessionId}`);
    });

    it('should use snsapi_userinfo scope', () => {
      const sessionId = 'test-session';
      const authUrl = service.getAuthUrl(sessionId);

      expect(authUrl).toContain('scope=snsapi_userinfo');
    });
  });

  describe('handleCallback', () => {
    it('should successfully get user info with valid code', async () => {
      const mockCode = 'test_auth_code';
      const mockAccessToken = 'test_access_token';
      const mockOpenId = 'test_openid';
      const mockUserInfo = {
        openid: mockOpenId,
        nickname: 'Test User',
        headimgurl: 'http://example.com/avatar.jpg',
        unionid: 'test_unionid',
      };

      // Mock access token response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: mockAccessToken,
          openid: mockOpenId,
          refresh_token: 'test_refresh_token',
        },
      });

      // Mock user info response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUserInfo,
      });

      const result = await service.handleCallback(mockCode);

      // Verify the result
      expect(result).toEqual(mockUserInfo);

      // Verify axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Verify access token request
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 
        'https://api.weixin.qq.com/sns/oauth2/access_token',
        {
          params: {
            appid: mockAppId,
            secret: mockAppSecret,
            code: mockCode,
            grant_type: 'authorization_code',
          },
        }
      );

      // Verify user info request
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        'https://api.weixin.qq.com/sns/userinfo',
        {
          params: {
            access_token: mockAccessToken,
            openid: mockOpenId,
            lang: 'zh_CN',
          },
        }
      );
    });

    it('should return user info without unionid if not provided', async () => {
      const mockCode = 'test_auth_code';
      const mockUserInfo = {
        openid: 'test_openid',
        nickname: 'Test User',
        headimgurl: 'http://example.com/avatar.jpg',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          openid: 'test_openid',
          refresh_token: 'test_refresh',
        },
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockUserInfo,
      });

      const result = await service.handleCallback(mockCode);

      expect(result).toEqual({
        ...mockUserInfo,
        unionid: undefined,
      });
    });

    it('should throw error when access token request fails', async () => {
      const mockCode = 'invalid_code';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          errcode: 40029,
          errmsg: 'invalid code',
        },
      });

      await expect(service.handleCallback(mockCode)).rejects.toThrow(
        'WeChat authorization failed: WeChat API error: 40029 - invalid code'
      );
    });

    it('should throw error when user info request fails', async () => {
      const mockCode = 'test_code';

      // Access token succeeds
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          openid: 'test_openid',
          refresh_token: 'test_refresh',
        },
      });

      // User info fails
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          errcode: 40001,
          errmsg: 'invalid access_token',
        },
      });

      await expect(service.handleCallback(mockCode)).rejects.toThrow(
        'WeChat authorization failed: WeChat API error: 40001 - invalid access_token'
      );
    });

    it('should throw error when access token response is missing required fields', async () => {
      const mockCode = 'test_code';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          // Missing access_token and openid
          refresh_token: 'test_refresh',
        },
      });

      await expect(service.handleCallback(mockCode)).rejects.toThrow(
        'WeChat authorization failed: Invalid response from WeChat API: missing access_token or openid'
      );
    });

    it('should throw error when user info response is missing required fields', async () => {
      const mockCode = 'test_code';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: 'test_token',
          openid: 'test_openid',
          refresh_token: 'test_refresh',
        },
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          openid: 'test_openid',
          // Missing nickname and headimgurl
        },
      });

      await expect(service.handleCallback(mockCode)).rejects.toThrow(
        'WeChat authorization failed: Invalid response from WeChat API: missing required user info fields'
      );
    });

    it('should throw error when network request fails', async () => {
      const mockCode = 'test_code';

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.handleCallback(mockCode)).rejects.toThrow(
        'WeChat authorization failed: Network error'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockRefreshToken = 'test_refresh_token';
      const mockNewAccessToken = 'new_access_token';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: mockNewAccessToken,
          openid: 'test_openid',
        },
      });

      const result = await service.refreshAccessToken(mockRefreshToken);

      expect(result).toBe(mockNewAccessToken);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.weixin.qq.com/sns/oauth2/refresh_token',
        {
          params: {
            appid: mockAppId,
            grant_type: 'refresh_token',
            refresh_token: mockRefreshToken,
          },
        }
      );
    });

    it('should throw error when refresh fails', async () => {
      const mockRefreshToken = 'invalid_refresh_token';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          errcode: 40030,
          errmsg: 'invalid refresh_token',
        },
      });

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
        'WeChat API error: 40030 - invalid refresh_token'
      );
    });

    it('should throw error when response is missing access_token', async () => {
      const mockRefreshToken = 'test_refresh_token';

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          // Missing access_token
          openid: 'test_openid',
        },
      });

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
        'Invalid response from WeChat API: missing access_token'
      );
    });
  });

  describe('constructor', () => {
    it('should use environment variables when no parameters provided', () => {
      // Set environment variables
      process.env.WECHAT_APP_ID = 'env_app_id';
      process.env.WECHAT_APP_SECRET = 'env_app_secret';
      process.env.WECHAT_REDIRECT_URI = 'http://env.example.com/callback';

      const envService = new WeChatAuthService();
      const authUrl = envService.getAuthUrl('test-session');

      expect(authUrl).toContain('appid=env_app_id');
      expect(authUrl).toContain(encodeURIComponent('http://env.example.com/callback'));

      // Clean up
      delete process.env.WECHAT_APP_ID;
      delete process.env.WECHAT_APP_SECRET;
      delete process.env.WECHAT_REDIRECT_URI;
    });

    it('should warn when configuration is incomplete', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      new WeChatAuthService('', '', '');

      expect(consoleSpy).toHaveBeenCalledWith(
        'WeChat OAuth configuration is incomplete. Please set WECHAT_APP_ID, WECHAT_APP_SECRET, and WECHAT_REDIRECT_URI.'
      );

      consoleSpy.mockRestore();
    });
  });
});
