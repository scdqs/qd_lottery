import './MainPage.css';

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
import imgHeader from '../assets/img_header.png';
import imgLogo from '../assets/img_logo.png';
import imgHorse from '../assets/img_horse.png';
import imgWinnersTitle from '../assets/img_winners_title.png';
import imgPlayerTitle from '../assets/img_player_title.png';
import imgFirecrackers from '../assets/img_firecrackers.png';
import imgHorseLucky from '../assets/img_horse_lucky.png';
import imgPlayerBg from '../assets/img_play_bg2.png';
import avatarPlaceholder from '../assets/avatar_placeholder.png';
import { Participant } from '../types';


//测试数据
const mockWinners: Participant[] = [
  { userId: '1', nickname: '李佳宴1', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '1' },
  { userId: '2', nickname: '李佳宴2', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '2' },
  { userId: '3', nickname: '李佳宴3', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '3' },
  { userId: '4', nickname: '李佳宴4', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '4' },
  { userId: '5', nickname: '李佳宴5', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '5' },
  { userId: '6', nickname: '李佳宴6', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '6' },
  { userId: '7', nickname: '李佳宴7', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '7' },
  { userId: '8', nickname: '李佳宴8', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '8' },
  { userId: '9', nickname: '李佳宴9', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '9' },
  { userId: '10', nickname: '李佳宴10', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '10' },
  { userId: '11', nickname: '李佳宴11', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '11' },
  { userId: '12', nickname: '李佳宴12', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '12' },
  { userId: '13', nickname: '李佳宴13', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '13' },
  { userId: '14', nickname: '李佳宴14', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '14' },
  { userId: '15', nickname: '李佳宴15', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '15' },
  { userId: '16', nickname: '李佳宴16', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '16' },
  { userId: '17', nickname: '李佳宴17', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '17' },
  { userId: '18', nickname: '李佳宴18', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '18' },
  { userId: '19', nickname: '李佳宴19', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '19' },
  { userId: '20', nickname: '李佳宴20', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '20' },
  { userId: '21', nickname: '李佳宴21', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '21' },
  { userId: '22', nickname: '李佳宴22', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '22' },
  { userId: '23', nickname: '李佳宴23', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '23' },
  { userId: '24', nickname: '李佳宴24', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '24' },
  { userId: '25', nickname: '李佳宴25', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '25' },
  { userId: '26', nickname: '李佳宴26', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '26' },
  { userId: '27', nickname: '李佳宴27', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '27' },
  { userId: '28', nickname: '李佳宴28', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '28' },
  { userId: '29', nickname: '李佳宴29', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '29' },
  { userId: '30', nickname: '李佳宴30', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '30' },
  { userId: '31', nickname: '李佳宴31', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '31' },
  { userId: '32', nickname: '李佳宴32', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '32' },
  { userId: '33', nickname: '李佳宴33', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '33' },
  { userId: '34', nickname: '李佳宴34', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '34' },
  { userId: '35', nickname: '李佳宴35', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '35' },
  { userId: '36', nickname: '李佳宴36', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '36' },
  { userId: '37', nickname: '李佳宴37', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '37' },
  { userId: '38', nickname: '李佳宴38', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '38' },
  { userId: '39', nickname: '李佳宴39', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '39' },
  { userId: '40', nickname: '李佳宴40', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '40' },
  { userId: '41', nickname: '李佳宴41', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '41' },
  { userId: '42', nickname: '李佳宴42', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '42' },
  { userId: '43', nickname: '李佳宴43', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '43' },
  { userId: '44', nickname: '李佳宴44', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '44' },
  { userId: '45', nickname: '李佳宴45', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '45' },
  { userId: '46', nickname: '李佳宴46', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '46' },
  { userId: '47', nickname: '李佳宴47', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '47' },
  { userId: '48', nickname: '李佳宴48', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '48' },
  { userId: '49', nickname: '李佳宴49', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '49' },
  { userId: '50', nickname: '李佳宴50', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '50' },
  { userId: '51', nickname: '李佳宴51', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '51' },
  { userId: '52', nickname: '李佳宴52', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '52' },
  { userId: '53', nickname: '李佳宴53', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '53' },
  { userId: '54', nickname: '李佳宴54', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '54' },
  { userId: '55', nickname: '李佳宴55', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '55' },
  { userId: '56', nickname: '李佳宴56', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '56' },
  { userId: '57', nickname: '李佳宴57', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '57' },
  { userId: '58', nickname: '李佳宴58', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '58' },
  { userId: '59', nickname: '李佳宴59', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '59' },
  { userId: '60', nickname: '李佳宴60', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '60' },
  { userId: '61', nickname: '李佳宴61', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '61' },
  { userId: '62', nickname: '李佳宴62', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '62' },
  { userId: '63', nickname: '李佳宴63', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '63' },
  { userId: '64', nickname: '李佳宴64', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '64' },
  { userId: '65', nickname: '李佳宴65', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '65' },
  { userId: '66', nickname: '李佳宴66', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '66' },
  { userId: '67', nickname: '李佳宴67', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '67' },
  { userId: '68', nickname: '李佳宴68', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '68' },
  { userId: '69', nickname: '李佳宴69', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '69' },
  { userId: '70', nickname: '李佳宴70', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '70' },
  { userId: '71', nickname: '李佳宴71', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '71' },
  { userId: '72', nickname: '李佳宴72', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '72' },
  { userId: '73', nickname: '李佳宴73', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '73' },
  { userId: '74', nickname: '李佳宴74', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '74' },
  { userId: '75', nickname: '李佳宴75', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '75' },
  { userId: '76', nickname: '李佳宴76', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '76' },
  { userId: '77', nickname: '李佳宴77', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '77' },
  { userId: '78', nickname: '李佳宴78', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '78' },
  { userId: '79', nickname: '李佳宴79', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '79' },
  { userId: '80', nickname: '李佳宴80', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '80' },
  { userId: '81', nickname: '李佳宴81', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '81' },
  { userId: '82', nickname: '李佳宴82', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '82' },
  { userId: '83', nickname: '李佳宴83', avatarUrl: avatarPlaceholder, joinedAt: 123, socketId: '83' },
];

// TEST_ONLY: 模拟中奖者数据
const mockTestWinners = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  userId: `test-user-${i + 1}`,
  nickname: `测试中奖者 ${i + 1}`,
  avatarUrl: avatarPlaceholder,
  shakeCount: Math.floor(Math.random() * 500) + 100,
}));
// END_TEST_ONLY


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
  const [winnerCount, setWinnerCount] = useState<number>(3); // 默认3人中奖
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
          winnerCount: winnerCount,
        });
        showInfo('抽奖已结束，正在计算结果...');
        // 状态更新将由lottery-result事件触发
      }
    }
  }, [state.lotteryStatus, state.countdown, wsClient, state.sessionInfo, dispatch, showInfo, winnerCount]);

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

  // TEST_ONLY: 触发测试模式
  const handleTestShowWinners = useCallback(() => {
    dispatch({ type: 'SET_WINNERS', payload: mockTestWinners });
  }, [dispatch]);
  // END_TEST_ONLY

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
      <img src={imgLogo} alt="logo" className="main-logo" />
      {/* 通知容器 */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* TEST_ONLY: 测试按钮，点击直接进入中奖结果页 */}
      {/* <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999 }}>
        <button
          onClick={handleTestShowWinners}
          style={{
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          [TEST] 直接展示10个中奖者
        </button>
      </div>
      {/* END_TEST_ONLY */}

      {/* 连接状态指示器 - 只在会话创建后显示 */}
      {state.lotteryStatus !== 'idle' && (
        <ConnectionStatusIndicator
          status={connectionStatus as any}
          onReconnect={handleReconnect}
          onRefresh={handleRefresh}
        />
      )}

      <header className="main-header">
        <div className="header-img-wrap">
          <img src={imgHeader} alt="header" className="header-img" />
          <img src={imgHorse} alt="horse" className="header-horse" />
        </div>
        {/* <h1 >趣点摇一摇</h1> */}
        <div className="status-bar">
          {/* <span className="status-label">状态</span> */}
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
              {/* <h2>扫描二维码参与抽奖</h2> */}
              {qrCodeUrl && (
                <div className="qrcode-container">
                  <div className="qrcode-bg">
                    <img src={qrCodeUrl} alt="抽奖二维码" className="qrcode-image" />
                  </div>
                  {/* <p className="qrcode-hint">使用微信扫描二维码</p> */}
                </div>
              )}
              <div className="session-info">
                <p className="session-id">会话ID: {state.sessionInfo?.sessionId}</p>
                <p className="participant-count">参与人数: {state.participants.length}</p>
              </div>
            </section>

            {/* 抽奖结果区域 */}
            <section className="lottery-control-section">
              <img src={imgFirecrackers} alt="firecrackers" className="lottery-firecrackers" />
              <img src={imgHorseLucky} alt="horse lucky" className="lottery-horse-lucky" />
              {/* <h2>抽奖结果</h2> */}
              <img src={imgWinnersTitle} alt="中奖名单" className="winners-title-img" />

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

              {/* 中奖人数配置 */}
              {state.lotteryStatus === 'waiting' && (
                <div className="duration-config">
                  <label htmlFor="winnerCount">中奖人数:</label>
                  <input
                    id="winnerCount"
                    type="number"
                    min="1"
                    max="100"
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(Number(e.target.value))}
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
                  {/* <h3>剩余时间</h3> */}
                  <div className="countdown-timer">{state.countdown}秒</div>
                </div>
              )}

              {/* 中奖结果 */}
              {state.lotteryStatus === 'finished' && state.winners.length > 0 && (
                <WinnerDisplay winners={state.winners} />
              )}
            </section>

            {/* 动态内容区域：开始抽奖后，图表和参与者列表互换位置 */}
            <div className={`dynamic-content-wrapper ${state.lotteryStatus === 'running' ? 'is-running' : ''}`}>
              {/* 实时摇动数据图表 - 仅在运行时显示，但放在前面以便在 is-running 时排在上面 */}
              {state.lotteryStatus === 'running' && state.participants.length > 0 && (
                <div className="shake-chart-container">
                  <ShakeChart
                    participants={state.participants}
                    shakeData={state.shakeData}
                  />
                </div>
              )}

              {/* 参与者列表预览 */}
              {state.participants.length > 0 && (
                <section className="participants-preview">
                  <img src={imgPlayerBg} alt="participants background" className="participants-preview-bg" />
                  {/* <h3>参与者 ({state.participants.length})</h3> */}
                  <img src={imgPlayerTitle} alt="参与者" className="player-title-img" />
                  <div className="participants-scroll">
                    <div className="participants-grid">
                      {
                        // mockWinners.map((participant) => (
                        state.participants.map((participant) => (
                          <div key={participant.userId} className="participant-card">
                            <img
                              src={participant.avatarUrl || '/head.png'}
                              alt={participant.nickname}
                              className="participant-avatar"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/head.png';
                              }}
                            />
                            <p className="participant-nickname">{participant.nickname}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
