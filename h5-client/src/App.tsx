import React, { useEffect, useState } from 'react';
import { useAppContext } from './context/AppContext';
import { getWebSocketClient } from './services/websocket';
import AuthPage from './components/AuthPage';
import ShakePage from './components/ShakePage';
import { SessionInputPage } from './components/SessionInputPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer, useToast } from './components/Toast';
import { WeChatUserInfo } from './types';
import { config } from './config';
import './App.css';

function AppContent() {
  const { 
    sessionId, 
    setSessionId, 
    userInfo, 
    authStatus,
    setErrorMessage,
    setShakeStatus,
    setWinners,
    checkWinnerStatus,
  } = useAppContext();
  
  const [wsClient, setWsClient] = useState<ReturnType<typeof getWebSocketClient> | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { toasts, removeToast, showError, showWarning, showSuccess, showInfo } = useToast();

  // 获取WebSocket服务器URL
  const WS_URL = config.WS_URL;

  useEffect(() => {
    // 从URL获取会话ID
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('sessionId');

    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl);
    }
    // 如果没有会话ID，不显示错误，而是显示输入页面
  }, [setSessionId]);

  /**
   * 处理摇动数据更新
   * 需求: 5.4 - 发送摇动数据到服务器
   */
  const handleShakeCountUpdate = (count: number) => {
    if (wsClient && sessionId && userInfo) {
      try {
        wsClient.sendShakeData(sessionId, userInfo.openid, count);
      } catch (error) {
        console.error('Failed to send shake data:', error);
        showError('发送数据失败');
      }
    }
  };

  /**
   * 处理授权成功
   * 初始化WebSocket连接并发送用户信息
   */
  const handleAuthSuccess = async (userInfo: WeChatUserInfo) => {
    if (!sessionId) {
      const errorMsg = '会话ID不存在';
      setErrorMessage(errorMsg);
      showError(errorMsg);
      return;
    }

    try {
      // 初始化WebSocket客户端
      const client = getWebSocketClient(WS_URL);
      setWsClient(client);

      // 连接到WebSocket服务器
      showInfo('正在连接服务器...');
      await client.connect();
      showSuccess('连接成功！');

      // 加入会话
      client.joinSession(sessionId);

      // 监听会话加入结果
      client.onSessionJoined((data) => {
        if (data.success) {
          console.log('Successfully joined session');
          // 发送用户信息到服务器（任务14.2）
          client.sendUserInfo(sessionId, userInfo);
          showSuccess('已加入抽奖！');
        } else {
          const errorMsg = data.message || '加入会话失败';
          setErrorMessage(errorMsg);
          showError(errorMsg);
        }
      });

      // 监听抽奖开始事件
      client.onLotteryStarted((data) => {
        console.log('Lottery started:', data);
        setShakeStatus('shaking');
        showSuccess('抽奖开始！开始摇动手机吧！', 3000);
        // 触发ShakePage的startShaking方法
        if ((window as any).__shakePageMethods) {
          (window as any).__shakePageMethods.startShaking();
        }
      });

      // 监听抽奖停止事件
      client.onLotteryStopped(() => {
        console.log('Lottery stopped');
        setShakeStatus('stopped');
        showInfo('抽奖已结束，正在计算结果...', 3000);
        // 触发ShakePage的stopShaking方法
        if ((window as any).__shakePageMethods) {
          (window as any).__shakePageMethods.stopShaking();
        }
      });

      // 监听中奖结果
      client.onLotteryResult((data) => {
        console.log('Lottery result:', data);
        // 触发ShakePage的handleLotteryResult方法
        if ((window as any).__shakePageMethods) {
          (window as any).__shakePageMethods.handleLotteryResult(data.winners);
        }
      });

      // 监听错误
      client.onError((data) => {
        setErrorMessage(data.message);
        showError(data.message);
        
        // 如果是连接错误，提示用户刷新
        if (data.message.includes('连接') || data.message.includes('刷新')) {
          setReconnectAttempts((prev) => prev + 1);
          if (reconnectAttempts >= 2) {
            showError('连接失败，请刷新页面重试', 0);
          }
        }
      });

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      const errorMsg = '连接服务器失败，请刷新页面重试';
      setErrorMessage(errorMsg);
      showError(errorMsg, 0);
    }
  };

  // 处理手动输入会话ID
  const handleSessionIdSubmit = (inputSessionId: string) => {
    setSessionId(inputSessionId);
    // 更新URL，添加sessionId参数
    const newUrl = `${window.location.pathname}?sessionId=${inputSessionId}`;
    window.history.pushState({}, '', newUrl);
    showSuccess('会话ID已设置！');
  };

  // 渲染不同的页面状态
  const renderContent = () => {
    // 如果没有会话ID，显示输入页面
    if (!sessionId) {
      return <SessionInputPage onSubmit={handleSessionIdSubmit} />;
    }

    // 如果未授权，显示授权页面
    if (authStatus !== 'success') {
      return (
        <AuthPage 
          sessionId={sessionId} 
          onAuthSuccess={handleAuthSuccess}
        />
      );
    }

    // 授权成功后，显示摇一摇页面
    if (userInfo) {
      return (
        <ShakePage
          sessionId={sessionId}
          userId={userInfo.openid}
          onShakeCountUpdate={handleShakeCountUpdate}
        />
      );
    }

    // 默认显示等待页面
    return (
      <div className="app-content">
        <div className="welcome-section">
          <h2>加载中...</h2>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="app">
        {renderContent()}
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
