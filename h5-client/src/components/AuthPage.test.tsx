import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AuthPage from './AuthPage';
import { AppProvider } from '../context/AppContext';
import { WeChatUserInfo } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('AuthPage Component', () => {
  const mockSessionId = 'test-session-123';
  const mockOnAuthSuccess = jest.fn();
  const mockUserInfo: WeChatUserInfo = {
    openid: 'test-openid',
    nickname: 'Test User',
    headimgurl: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location
    delete (window as any).location;
    window.location = {
      search: '',
      href: '',
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderAuthPage = () => {
    return render(
      <AppProvider>
        <AuthPage sessionId={mockSessionId} onAuthSuccess={mockOnAuthSuccess} />
      </AppProvider>
    );
  };

  const setUrlParams = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    delete (window as any).location;
    window.location = {
      search: `?${searchParams.toString()}`,
      href: '',
    } as any;
  };

  describe('Initial State - Pending', () => {
    it('should render authorization prompt when status is pending', () => {
      renderAuthPage();

      expect(screen.getByText('欢迎参与抽奖')).toBeInTheDocument();
      expect(screen.getByText('需要获取您的微信信息才能参与抽奖')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '授权并参与' })).toBeInTheDocument();
    });

    it('should have authorization button enabled initially', () => {
      renderAuthPage();

      const authButton = screen.getByRole('button', { name: '授权并参与' });
      expect(authButton).not.toBeDisabled();
    });
  });

  describe('Authorization Request', () => {
    it('should redirect to WeChat auth URL when authorization button is clicked', () => {
      const originalLocation = window.location.href;
      delete (window as any).location;
      window.location = { href: originalLocation } as any;

      renderAuthPage();

      const authButton = screen.getByRole('button', { name: '授权并参与' });
      fireEvent.click(authButton);

      // Should redirect to backend auth endpoint
      expect(window.location.href).toContain('/api/wechat/auth');
      expect(window.location.href).toContain(`sessionId=${mockSessionId}`);
    });
  });

  describe('Authorization Callback Handling', () => {
    it('should handle successful authorization callback', async () => {
      // Set URL with authorization code and state
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userInfo: mockUserInfo }),
      });

      renderAuthPage();

      // Wait for callback processing
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/wechat/callback'),
        );
      });

      // Should call onAuthSuccess with user info
      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUserInfo);
      });
    });

    it('should display success state after successful authorization', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userInfo: mockUserInfo }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('授权成功')).toBeInTheDocument();
      });
    });

    it('should validate state parameter matches session ID', async () => {
      // Set URL with mismatched state
      setUrlParams({ code: 'test-auth-code', state: 'wrong-session-id' });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('授权失败')).toBeInTheDocument();
        expect(screen.getByText('授权会话不匹配，请重新扫码')).toBeInTheDocument();
      });

      // Should not call API
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle authorization failure from API', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      // Mock API error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '授权码无效' }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('授权失败')).toBeInTheDocument();
        expect(screen.getByText('授权码无效')).toBeInTheDocument();
      });
    });

    it('should handle incomplete user info from API', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      // Mock API response with incomplete user info
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userInfo: {
            openid: 'test-openid',
            // Missing nickname and headimgurl
          },
        }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('授权失败')).toBeInTheDocument();
        expect(screen.getByText('用户信息不完整')).toBeInTheDocument();
      });
    });

    it('should handle network errors during callback', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('授权失败')).toBeInTheDocument();
      });
    });

    it('should clear URL parameters after successful authorization', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userInfo: mockUserInfo }),
      });

      // Mock window.history.replaceState
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

      renderAuthPage();

      await waitFor(() => {
        expect(mockOnAuthSuccess).toHaveBeenCalled();
      });

      // Should have called replaceState to clear URL
      expect(replaceStateSpy).toHaveBeenCalled();
    });
  });

  describe('Authorization Status Display', () => {
    it('should display authorizing state during processing', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      // Mock delayed response
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ userInfo: mockUserInfo }),
                }),
              100
            )
          )
      );

      renderAuthPage();

      // Should show authorizing state
      expect(screen.getByText('授权中...')).toBeInTheDocument();
      expect(screen.getByText('正在获取您的微信信息，请稍候')).toBeInTheDocument();
    });

    it('should display failed state with retry button', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '授权失败' }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '授权失败' })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: '重新授权' });
      expect(retryButton).toBeInTheDocument();
    });

    it('should reset to pending state when retry button is clicked', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '授权失败' }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '授权失败' })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: '重新授权' });
      fireEvent.click(retryButton);

      // Should return to pending state
      await waitFor(() => {
        expect(screen.getByText('欢迎参与抽奖')).toBeInTheDocument();
      });
    });
  });

  describe('User Info Validation', () => {
    it('should validate openid is present', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userInfo: {
            nickname: 'Test User',
            headimgurl: 'https://example.com/avatar.jpg',
          },
        }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('用户信息不完整')).toBeInTheDocument();
      });
    });

    it('should validate nickname is present', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userInfo: {
            openid: 'test-openid',
            headimgurl: 'https://example.com/avatar.jpg',
          },
        }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('用户信息不完整')).toBeInTheDocument();
      });
    });

    it('should validate headimgurl is present', async () => {
      setUrlParams({ code: 'test-auth-code', state: mockSessionId });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userInfo: {
            openid: 'test-openid',
            nickname: 'Test User',
          },
        }),
      });

      renderAuthPage();

      await waitFor(() => {
        expect(screen.getByText('用户信息不完整')).toBeInTheDocument();
      });
    });
  });
});
