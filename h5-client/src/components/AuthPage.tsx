import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { WeChatUserInfo } from '../types';
import { config } from '../config';
import './AuthPage.css';

/**
 * 授权页面组件
 * 
 * 职责: 引导用户完成微信授权
 * 
 * 功能:
 * - 显示授权引导页面
 * - 处理微信授权跳转
 * - 处理授权回调
 * - 显示授权状态（pending、authorizing、success、failed）
 * - 处理授权失败情况
 * 
 * 验证需求: 2.1, 2.2, 2.3, 2.5
 */

interface AuthPageProps {
  sessionId: string;
  onAuthSuccess: (userInfo: WeChatUserInfo) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ sessionId, onAuthSuccess }) => {
  const { authStatus, setAuthStatus, setUserInfo, errorMessage, setErrorMessage } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testNickname, setTestNickname] = useState('');
  const [testAvatarUrl, setTestAvatarUrl] = useState('');

  // 获取后端API URL
  const API_URL = config.API_URL;

  useEffect(() => {
    // 检查URL中是否有授权回调参数
    const urlParams = new URLSearchParams(window.location.search);

    // 方案A: 检查是否有 base64 编码的用户信息（从后端重定向带回）
    const userInfoBase64 = urlParams.get('userInfo');
    const errorFromCallback = urlParams.get('error');

    if (errorFromCallback) {
      // 处理后端返回的错误
      setAuthStatus('failed');
      setErrorMessage(decodeURIComponent(errorFromCallback));
      // 清除URL中的错误参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, document.title, newUrl.toString());
      return;
    }

    if (userInfoBase64) {
      // 解析 base64 编码的用户信息
      try {
        const normalizedBase64 = (() => {
          const withPlus = userInfoBase64.replace(/ /g, '+');
          const base64 = withPlus.replace(/-/g, '+').replace(/_/g, '/');
          const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
          return base64 + padding;
        })();
        const binaryStr = atob(normalizedBase64);
        const bytes = Uint8Array.from(binaryStr, (char) => char.charCodeAt(0));
        const userInfoJson = typeof TextDecoder !== 'undefined'
          ? new TextDecoder('utf-8').decode(bytes)
          : decodeURIComponent(escape(binaryStr));
        const userInfo: WeChatUserInfo = JSON.parse(userInfoJson);

        // 验证用户信息完整性
        if (!userInfo.openid || !userInfo.nickname || !userInfo.headimgurl) {
          throw new Error('用户信息不完整');
        }

        // 更新状态
        setUserInfo(userInfo);
        setAuthStatus('success');
        setErrorMessage(null);

        // 清除URL中的用户信息参数
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('userInfo');
        window.history.replaceState({}, document.title, newUrl.toString());

        // 通知父组件授权成功
        onAuthSuccess(userInfo);
      } catch (error) {
        console.error('Failed to parse user info:', error);
        setAuthStatus('failed');
        setErrorMessage('解析用户信息失败，请重新授权');
      }
      return;
    }

    // 方案B兼容: 检查是否有 code 和 state（旧的回调方式）
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // 处理授权回调
      handleAuthCallback(code, state);
    }
  }, []);

  /**
   * 请求微信授权
   * 跳转到微信授权页面
   */
  const requestWeChatAuth = () => {
    try {
      setAuthStatus('authorizing');
      setErrorMessage(null);

      // 构建授权URL
      // 后端会生成完整的微信授权URL
      const authUrl = `${API_URL}/api/wechat/auth?sessionId=${sessionId}`;

      // 跳转到授权页面
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to request WeChat authorization:', error);
      setAuthStatus('failed');
      setErrorMessage('无法跳转到授权页面，请稍后重试');
    }
  };

  /**
   * 处理授权回调
   * 使用授权码获取用户信息
   */
  const handleAuthCallback = async (code: string, state: string) => {
    // 验证state参数是否匹配当前会话ID
    if (state !== sessionId) {
      setAuthStatus('failed');
      setErrorMessage('授权会话不匹配，请重新扫码');
      return;
    }

    setIsProcessing(true);
    setAuthStatus('authorizing');

    try {
      // 调用后端回调接口获取用户信息
      const response = await fetch(
        `${API_URL}/api/wechat/callback?code=${code}&state=${state}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '授权失败');
      }

      const data = await response.json();
      const userInfo: WeChatUserInfo = data.userInfo;

      // 验证用户信息完整性（需求2.3）
      if (!userInfo.openid || !userInfo.nickname || !userInfo.headimgurl) {
        throw new Error('用户信息不完整');
      }

      // 更新状态
      setUserInfo(userInfo);
      setAuthStatus('success');
      setErrorMessage(null);

      // 清除URL中的授权参数
      window.history.replaceState({}, document.title, window.location.pathname);

      // 通知父组件授权成功
      onAuthSuccess(userInfo);
    } catch (error) {
      console.error('Authorization callback failed:', error);
      setAuthStatus('failed');

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('授权失败，请重试');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 测试模式：使用模拟数据授权
   */
  const handleTestModeAuth = () => {
    if (!testNickname.trim()) {
      setErrorMessage('请输入昵称');
      return;
    }

    setIsProcessing(true);
    setAuthStatus('authorizing');

    // 模拟异步授权过程
    setTimeout(() => {
      const mockUserInfo: WeChatUserInfo = {
        openid: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname: testNickname.trim(),
        headimgurl: testAvatarUrl.trim() || 'https://via.placeholder.com/100?text=' + encodeURIComponent(testNickname.charAt(0)),
      };

      setUserInfo(mockUserInfo);
      setAuthStatus('success');
      setErrorMessage(null);
      setIsProcessing(false);

      // 通知父组件授权成功
      onAuthSuccess(mockUserInfo);
    }, 500);
  };

  /**
   * 重试授权
   */
  const retryAuth = () => {
    setAuthStatus('pending');
    setErrorMessage(null);
  };

  // 渲染不同的授权状态
  const renderContent = () => {
    // 测试模式界面
    if (testMode && authStatus === 'pending') {
      return (
        <div className="auth-content">
          <img src="/images/gift_icon.png" alt="礼物" className="auth-gift-icon" />
          <h2>测试模式</h2>
          <p className="auth-description">
            输入测试信息快速参与抽奖
          </p>

          <div className="test-form">
            <div className="form-group">
              <label htmlFor="nickname">昵称 *</label>
              <input
                id="nickname"
                type="text"
                value={testNickname}
                onChange={(e) => setTestNickname(e.target.value)}
                placeholder="请输入昵称"
                className="test-input"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label htmlFor="avatar">头像URL（可选）</label>
              <input
                id="avatar"
                type="text"
                value={testAvatarUrl}
                onChange={(e) => setTestAvatarUrl(e.target.value)}
                placeholder="留空使用默认头像"
                className="test-input"
              />
            </div>

            {errorMessage && (
              <p className="error-text">{errorMessage}</p>
            )}

            <button
              className="auth-button primary"
              onClick={handleTestModeAuth}
              disabled={isProcessing || !testNickname.trim()}
            >
              开始参与
            </button>

            <button
              className="auth-button link"
              onClick={() => setTestMode(false)}
            >
              返回微信授权
            </button>
          </div>
        </div>
      );
    }

    switch (authStatus) {
      case 'pending':
        return (
          <div className="auth-content">
            <img src="/images/gift_icon.png" alt="礼物" className="auth-gift-icon" />
            <h2>欢迎参与抽奖</h2>
            <p className="auth-description">
              需要获取您的微信才能参与抽奖
            </p>
            <button
              className="auth-button primary"
              onClick={requestWeChatAuth}
              disabled={isProcessing}
            >
              微信授权并参与
            </button>
          </div>
        );

      case 'authorizing':
        return (
          <div className="auth-content">
            <div className="auth-loading">
              <div className="spinner"></div>
            </div>
            <h2>授权中...</h2>
            <p className="auth-description">
              正在获取您的微信信息，请稍候
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="auth-content">
            <div className="auth-icon success">✓</div>
            <h2>授权成功</h2>
            <p className="auth-description">
              正在进入抽奖页面...
            </p>
          </div>
        );

      case 'failed':
        return (
          <div className="auth-content">
            <div className="auth-icon error">✗</div>
            <h2>授权失败</h2>
            <p className="auth-description error">
              {errorMessage || '授权过程出现问题，请重试'}
            </p>
            <button
              className="auth-button secondary"
              onClick={retryAuth}
            >
              重新授权
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      {/* 装饰图片层 */}
      <img src="/images/decor_top-67619e.png" alt="" className="decor-top" />
      <img src="/images/decor_right_top.png" alt="" className="decor-right-top" />
      <img src="/images/banner_title.png" alt="" className="decor-banner" />
      <img src="/images/decor_left_bottom.png" alt="" className="decor-left-bottom" />
      <img src="/images/decor_cat.png" alt="" className="decor-cat" />
      <img src="/images/logo_bottom.png" alt="" className="decor-logo" />

      {/* 中间白色卡片 */}
      <div className="auth-card">
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthPage;
