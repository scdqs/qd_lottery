/**
 * 主页面组件
 * 管理整个抽奖流程的主界面
 * 
 * 需求: 1.1, 1.2, 1.3, 4.1, 4.2, 4.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLottery } from '../context/LotteryContext';
import { createSession } from '../services/api';
import { WebSocketClient } from '../services/websocket';
import { ShakeChart } from './ShakeChart';
import { WinnerDisplay } from './WinnerDisplay';
import { NotificationContainer } from './Notification';
import { ConnectionStatusIndicator } from './ConnectionStatus';
import { useNotification } from '../hooks/useNotification';
import QRCode from 'qrcode';

// 获取WebSocket URL（兼容测试环境）
const getWsUrl = () => {
  if (typeof window !== 'undefined' && (window as any).VITE_WS_URL) {
    return (window as any).VITE_WS_URL;
  }
  return import.meta.env.VITE_WS_URL || 'http://localhost:3000';
};

const WS_URL = getWsUrl();

export function MainPage() {
  const { state, dispatch } = useLottery();
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(60); // 默认60秒
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const pendingShakeUpdatesRef = useRef<Map<string, number>>(new Map());
  const flushTimerRef = useRef<number | null>(null);
  
  // 使用通知Hook
  const { notifications, removeNotification, showError, showWarning, showSuccess, showInfo } = useNotification();

  const scheduleShakeFlush = useCallback(() => {
    if (flushTimerRef.current !== null) {
      return;
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      const entries = Array.from(pendingShakeUpdatesRef.current, ([userId, shakeCount]) => ({
        userId,
        shakeCount,
      }));
      pendingShakeUpdatesRef.current.clear();
      if (entries.length > 0) {
        dispatch({ type: 'BATCH_SHAKE_DATA', payload: entries });
      }
    }, 100);
  }, [dispatch]);

  // 创建会话
  const handleCreateSession = useCallback(async () => {
    try {
      setIsCreatingSession(true);
      dispatch({ type: 'SET_ERROR', payload: null });

      // 调用API创建会话
      const sessionInfo = await createSession();
      
      // 生成二维码
      const qrUrl = await QRCode.toDataURL(sessionInfo.qrCodeData);
      setQrCodeUrl(qrUrl);

      // 更新状态
      dispatch({ type: 'SET_SESSION_INFO', payload: sessionInfo });

      // 建立WebSocket连接
      const client = new WebSocketClient({ url: WS_URL });
      const socket = client.connect();

      // 监听连接状态
      client.onStatusChange((status) => {
        setConnectionStatus(status);
        
        // 根据连接状态显示通知
        if (status === 'reconnecting') {
          showWarning('连接已断开，正在尝试重新连接...', { duration: 0 });
        } else if (status === 'failed') {
          showError('连接失败超过3次，请刷新页面重试', {
            duration: 0,
            action: {
              label: '刷新',
              onClick: () => window.location.reload(),
            },
          });
        } else if (status === 'connected') {
          showSuccess('连接已恢复', { duration: 3000 });
        }
      });

      // 加入会话
      socket.on('connect', () => {
        socket.emit('join-session', {
          sessionId: sessionInfo.sessionId,
          clientType: 'web',
        });
      });

      // 监听会话加入成功
      socket.on('session-joined', (data) => {
        if (!data.success) {
          const errorMsg = data.message || '加入会话失败';
          dispatch({ type: 'SET_ERROR', payload: errorMsg });
          showError(errorMsg);
        } else {
          showSuccess('会话创建成功！');
        }
      });

      // 监听参与者加入
      socket.on('participant-joined', (data) => {
        dispatch({ type: 'ADD_PARTICIPANT', payload: data.participant });
        showInfo(`${data.participant.nickname} 加入了抽奖`, { duration: 3000 });
      });

      // 监听摇动数据更新
      socket.on('shake-update', (data) => {
        pendingShakeUpdatesRef.current.set(data.userId, data.shakeCount);
        scheduleShakeFlush();
      });

      // 监听抽奖结果
      socket.on('lottery-result', (data) => {
        dispatch({ type: 'SET_WINNERS', payload: data.winners });
        showSuccess('抽奖结果已公布！');
      });

      // 监听错误
      socket.on('error', (data) => {
        dispatch({ type: 'SET_ERROR', payload: data.message });
        showError(data.message);
      });

      setWsClient(client);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建会话失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showError(errorMessage);
    } finally {
      setIsCreatingSession(false);
    }
  }, [dispatch, showError, showWarning, showSuccess, showInfo]);

  // 开始抽奖
  const handleStartLottery = useCallback(() => {
    if (!wsClient || !state.sessionInfo) {
      const errorMsg = '会话未创建或连接未建立';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      showError(errorMsg);
      return;
    }

    if (state.participants.length === 0) {
      const errorMsg = '没有参与者，无法开始抽奖';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      showWarning(errorMsg);
      return;
    }

    // 发送开始抽奖指令
    wsClient.getSocket()?.emit('start-lottery', {
      sessionId: state.sessionInfo.sessionId,
      duration: duration,
    });

    // 更新状态为运行中
    dispatch({ type: 'SET_LOTTERY_STATUS', payload: 'running' });
    dispatch({ type: 'SET_COUNTDOWN', payload: duration });
    showSuccess('抽奖已开始！');
  }, [wsClient, state.sessionInfo, state.participants.length, duration, dispatch, showError, showWarning, showSuccess]);

  // 倒计时逻辑
  useEffect(() => {
    if (state.lotteryStatus === 'running' && state.countdown > 0) {
      const timer = setInterval(() => {
        dispatch({ type: 'DECREMENT_COUNTDOWN' });
      }, 1000);

      return () => clearInterval(timer);
    } else if (state.lotteryStatus === 'running' && state.countdown === 0) {
      // 倒计时结束，发送停止指令
      if (wsClient && state.sessionInfo) {
        wsClient.getSocket()?.emit('stop-lottery', {
          sessionId: state.sessionInfo.sessionId,
        });
        showInfo('抽奖已结束，正在计算结果...');
        // 状态更新将由lottery-result事件触发
      }
    }
  }, [state.lotteryStatus, state.countdown, wsClient, state.sessionInfo, dispatch, showInfo]);

  // 清理WebSocket连接
  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
      pendingShakeUpdatesRef.current.clear();
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, [wsClient]);

  // 处理重新连接
  const handleReconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
      const socket = wsClient.connect();
      if (state.sessionInfo) {
        socket.on('connect', () => {
          socket.emit('join-session', {
            sessionId: state.sessionInfo!.sessionId,
            clientType: 'web',
          });
        });
      }
    }
  }, [wsClient, state.sessionInfo]);

  // 处理刷新页面
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // 渲染状态文本
  const getStatusText = () => {
    switch (state.lotteryStatus) {
      case 'idle':
        return '未开始';
      case 'waiting':
        return '等待参与者';
      case 'running':
        return '抽奖进行中';
      case 'finished':
        return '抽奖已结束';
      default:
        return '未知状态';
    }
  };

  return (
    <div className="main-page">
      {/* 通知容器 */}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* 连接状态指示器 - 只在会话创建后显示 */}
      {state.lotteryStatus !== 'idle' && (
        <ConnectionStatusIndicator
          status={connectionStatus as any}
          onReconnect={handleReconnect}
          onRefresh={handleRefresh}
        />
      )}

      <header className="main-header">
        <h1>公司抽奖系统</h1>
        <div className="status-bar">
          <span className="status-label">状态:</span>
          <span className={`status-value status-${state.lotteryStatus}`}>
            {getStatusText()}
          </span>
        </div>
      </header>

      <main className="main-content">
        {/* 会话未创建 - 显示创建按钮 */}
        {state.lotteryStatus === 'idle' && (
          <div className="session-create-section">
            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateSession}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? '创建中...' : '创建抽奖会话'}
            </button>
          </div>
        )}

        {/* 会话已创建 - 显示二维码和控制面板 */}
        {state.lotteryStatus !== 'idle' && (
          <>
            {/* 二维码区域 */}
            <section className="qrcode-section">
              <h2>扫描二维码参与抽奖</h2>
              {qrCodeUrl && (
                <div className="qrcode-container">
                  <img src={qrCodeUrl} alt="抽奖二维码" className="qrcode-image" />
                  <p className="qrcode-hint">使用微信扫描二维码</p>
                </div>
              )}
              <div className="session-info">
                <p>会话ID: {state.sessionInfo?.sessionId}</p>
                <p>参与人数: {state.participants.length}</p>
              </div>
            </section>

            {/* 抽奖控制区域 */}
            <section className="lottery-control-section">
              <h2>抽奖控制</h2>
              
              {/* 倒计时配置 */}
              {state.lotteryStatus === 'waiting' && (
                <div className="duration-config">
                  <label htmlFor="duration">抽奖时长（秒）:</label>
                  <input
                    id="duration"
                    type="number"
                    min="10"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="duration-input"
                  />
                </div>
              )}

              {/* 开始抽奖按钮 */}
              {state.lotteryStatus === 'waiting' && (
                <button
                  className="btn btn-success btn-large"
                  onClick={handleStartLottery}
                  disabled={state.participants.length === 0}
                >
                  开始抽奖
                </button>
              )}

              {/* 倒计时显示 */}
              {state.lotteryStatus === 'running' && (
                <div className="countdown-display">
                  <h3>剩余时间</h3>
                  <div className="countdown-timer">{state.countdown}秒</div>
                </div>
              )}

              {/* 中奖结果 */}
              {state.lotteryStatus === 'finished' && state.winners.length > 0 && (
                <WinnerDisplay winners={state.winners} />
              )}
            </section>

            {/* 参与者列表预览 */}
            {state.participants.length > 0 && (
              <section className="participants-preview">
                <h3>参与者 ({state.participants.length})</h3>
                <div className="participants-grid">
                  {state.participants.slice(0, 12).map((participant) => (
                    <div key={participant.userId} className="participant-card">
                      <img
                        src={participant.avatarUrl}
                        alt={participant.nickname}
                        className="participant-avatar"
                      />
                      <p className="participant-nickname">{participant.nickname}</p>
                    </div>
                  ))}
                  {state.participants.length > 12 && (
                    <div className="participant-card more">
                      <p>+{state.participants.length - 12} 更多</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 实时摇动数据图表 */}
            {state.lotteryStatus === 'running' && state.participants.length > 0 && (
              <ShakeChart 
                participants={state.participants} 
                shakeData={state.shakeData} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
