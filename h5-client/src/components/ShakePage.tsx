import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShakeSensor } from '../services/ShakeSensor';
import { Winner } from '../types';
import './ShakePage.css';

/**
 * ShakePage组件
 * 显示摇一摇界面，处理传感器监听和中奖结果展示
 * 
 * 需求: 5.1, 5.5, 7.6
 */

interface ShakePageProps {
  sessionId: string;
  userId: string;
  onShakeCountUpdate: (count: number) => void;
  throttleInterval?: number; // 节流间隔（毫秒），默认500ms
}

const ShakePage: React.FC<ShakePageProps> = ({ 
  sessionId, 
  userId, 
  onShakeCountUpdate,
  throttleInterval = 500 // 默认500ms节流
}) => {
  const {
    shakeStatus,
    shakeCount,
    setShakeStatus,
    setShakeCount,
    isWinner,
    rank,
    winners,
    setWinners,
    checkWinnerStatus,
    setErrorMessage,
  } = useAppContext();

  const sensorRef = useRef<ShakeSensor | null>(null);
  const [sensorSupported, setSensorSupported] = useState(true);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [testMode, setTestMode] = useState(false); // 测试模式：使用按钮代替摇动
  const lastSendTimeRef = useRef<number>(0);
  const pendingCountRef = useRef<number | null>(null);

  useEffect(() => {
    // 初始化传感器
    const sensor = new ShakeSensor({
      threshold: 15,
      debounceTime: 100,
    });

    // 检查设备是否支持传感器
    if (!sensor.isSupported()) {
      setSensorSupported(false);
      setErrorMessage('您的设备不支持摇一摇功能');
      return;
    }

    // 检查是否需要请求权限（iOS 13+）
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      setNeedsPermission(true);
    }

    sensorRef.current = sensor;

    // 清理函数
    return () => {
      if (sensorRef.current) {
        sensorRef.current.stop();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  /**
   * 节流发送摇动数据
   * 需求: 5.4 - 实现数据节流（避免过于频繁发送）
   */
  const throttledSendShakeData = (count: number) => {
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;

    if (timeSinceLastSend >= throttleInterval) {
      // 如果距离上次发送已经超过节流间隔，立即发送
      onShakeCountUpdate(count);
      lastSendTimeRef.current = now;
      pendingCountRef.current = null;
    } else {
      // 否则，保存待发送的数据
      pendingCountRef.current = count;
    }
  };

  /**
   * 定期检查并发送待发送的数据
   */
  useEffect(() => {
    if (shakeStatus !== 'shaking') {
      return;
    }

    const intervalId = setInterval(() => {
      if (pendingCountRef.current !== null) {
        onShakeCountUpdate(pendingCountRef.current);
        lastSendTimeRef.current = Date.now();
        pendingCountRef.current = null;
      }
    }, throttleInterval);

    return () => {
      clearInterval(intervalId);
      // 组件卸载或停止摇动时，发送最后的数据
      if (pendingCountRef.current !== null) {
        onShakeCountUpdate(pendingCountRef.current);
        pendingCountRef.current = null;
      }
    };
  }, [shakeStatus, throttleInterval, onShakeCountUpdate]);

  /**
   * 测试模式：手动增加摇动次数
   */
  const handleManualShake = () => {
    if (shakeStatus !== 'shaking') {
      return;
    }
    
    const newCount = shakeCount + 1;
    setShakeCount(newCount);
    throttledSendShakeData(newCount);
  };

  /**
   * 切换到测试模式
   */
  const enableTestMode = () => {
    setTestMode(true);
    setSensorSupported(true); // 允许继续使用
    setErrorMessage(null);
  };

  /**
   * 请求传感器权限
   */
  const requestSensorPermission = async () => {
    if (!sensorRef.current) {
      return;
    }

    try {
      const granted = await sensorRef.current.requestPermission();
      setPermissionRequested(true);
      
      if (granted) {
        setNeedsPermission(false);
        setErrorMessage(null);
      } else {
        setSensorSupported(false);
        setErrorMessage('传感器权限被拒绝，无法使用摇一摇功能');
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      setSensorSupported(false);
      setErrorMessage('请求权限失败，请在浏览器设置中允许访问运动传感器');
    }
  };

  /**
   * 开始摇动监听
   * 需求: 5.2 - 接收开始指令后启动传感器监听
   */
  const startShaking = async () => {
    // 如果是测试模式，不需要启动传感器
    if (testMode) {
      setShakeStatus('shaking');
      return;
    }

    if (!sensorRef.current || !sensorSupported) {
      return;
    }

    try {
      setShakeStatus('shaking');
      sensorRef.current.reset();
      lastSendTimeRef.current = 0; // 重置发送时间
      pendingCountRef.current = null; // 清空待发送数据
      
      // 启动传感器监听（异步，可能需要请求权限）
      await sensorRef.current.start((count) => {
        setShakeCount(count);
        throttledSendShakeData(count); // 使用节流发送
      });
    } catch (error) {
      console.error('Failed to start shake sensor:', error);
      const errorMsg = error instanceof Error ? error.message : '启动传感器失败';
      
      if (errorMsg.includes('permission')) {
        setErrorMessage('需要授权访问传感器，请在浏览器设置中允许访问运动传感器');
      } else {
        setErrorMessage('启动传感器失败，请尝试使用"按钮模式"');
      }
      
      setShakeStatus('waiting');
      // 不要设置 setSensorSupported(false)，让用户可以选择测试模式
    }
  };

  /**
   * 停止摇动监听
   * 需求: 5.5 - 接收停止指令后停止监听
   */
  const stopShaking = () => {
    if (sensorRef.current) {
      sensorRef.current.stop();
      setShakeStatus('stopped');
    }
  };

  /**
   * 处理中奖结果
   * 需求: 7.6 - 显示用户是否中奖及获得的名次
   */
  const handleLotteryResult = (winners: Winner[]) => {
    setWinners(winners);
    checkWinnerStatus(userId, winners);
  };

  /**
   * 渲染等待状态
   * 需求: 5.1 - 显示等待开始状态
   */
  const renderWaitingState = () => {
    // 如果需要权限且还没请求，显示权限请求按钮
    if (needsPermission && !permissionRequested) {
      return (
        <div className="shake-page-content">
          <div className="shake-icon waiting">
            <span className="icon">🔐</span>
          </div>
          <h2 className="shake-title">需要授权</h2>
          <p className="shake-description">
            需要您的授权才能使用摇一摇功能
          </p>
          <button 
            className="permission-button"
            onClick={requestSensorPermission}
          >
            授权访问传感器
          </button>
          <div className="shake-tips">
            <p>💡 点击按钮后，请在弹窗中选择"允许"</p>
            <p>💡 这是iOS设备的安全要求</p>
          </div>
        </div>
      );
    }

    return (
      <div className="shake-page-content">
        <div className="shake-icon waiting">
          <span className="icon">📱</span>
        </div>
        <h2 className="shake-title">准备就绪</h2>
        <p className="shake-description">等待活动开始...</p>
        <div className="shake-tips">
          <p>💡 活动开始后，请用力摇动手机</p>
          <p>💡 摇动次数越多，中奖机会越大</p>
        </div>
      </div>
    );
  };

  /**
   * 渲染摇动状态
   * 需求: 5.1 - 显示"开始摇一摇"提示和当前摇动次数
   */
  const renderShakingState = () => (
    <div className="shake-page-content">
      <div className="shake-icon shaking">
        <span className="icon animate-shake">📱</span>
      </div>
      <h2 className="shake-title">开始摇一摇！</h2>
      <div className="shake-count-display">
        <span className="count-number">{shakeCount}</span>
        <span className="count-label">次</span>
      </div>
      <p className="shake-description">
        {testMode ? '点击下方按钮增加次数' : '用力摇动手机，冲击前三名！'}
      </p>
      
      {testMode && (
        <button 
          className="manual-shake-button"
          onClick={handleManualShake}
        >
          点击摇一摇 +1
        </button>
      )}
      
      {!testMode && (
        <div className="shake-animation">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>
      )}
    </div>
  );

  /**
   * 渲染停止状态
   * 需求: 5.5 - 显示等待结果提示
   */
  const renderStoppedState = () => (
    <div className="shake-page-content">
      <div className="shake-icon stopped">
        <span className="icon">⏸️</span>
      </div>
      <h2 className="shake-title">活动已结束</h2>
      <div className="shake-count-display">
        <span className="count-number">{shakeCount}</span>
        <span className="count-label">次</span>
      </div>
      <p className="shake-description">您的最终摇动次数</p>
      <p className="waiting-result">正在计算结果，请稍候...</p>
    </div>
  );

  /**
   * 渲染中奖结果
   * 需求: 7.6 - 显示用户是否中奖及获得的名次
   */
  const renderResultState = () => {
    if (isWinner && rank) {
      const rankLabels = ['', '🥇 一等奖', '🥈 二等奖', '🥉 三等奖'];
      return (
        <div className="shake-page-content result-winner">
          <div className="winner-badge">
            <span className="badge-icon">🎉</span>
          </div>
          <h2 className="result-title">恭喜中奖！</h2>
          <div className="winner-rank">{rankLabels[rank]}</div>
          <div className="shake-count-display">
            <span className="count-number">{shakeCount}</span>
            <span className="count-label">次</span>
          </div>
          <p className="result-description">您的摇动次数</p>
        </div>
      );
    } else {
      return (
        <div className="shake-page-content result-no-win">
          <div className="no-win-icon">
            <span className="icon">😊</span>
          </div>
          <h2 className="result-title">感谢参与</h2>
          <div className="shake-count-display">
            <span className="count-number">{shakeCount}</span>
            <span className="count-label">次</span>
          </div>
          <p className="result-description">您的摇动次数</p>
          <p className="encourage-text">下次继续加油！</p>
        </div>
      );
    }
  };

  /**
   * 渲染设备不支持提示
   * 需求: 5.6 - 显示设备不兼容提示
   */
  const renderUnsupportedState = () => (
    <div className="shake-page-content">
      <div className="shake-icon error">
        <span className="icon">⚠️</span>
      </div>
      <h2 className="shake-title">传感器不可用</h2>
      <p className="shake-description">
        您的设备传感器暂时无法使用
      </p>
      <p className="error-hint">
        可能原因：浏览器需要HTTPS或localhost访问传感器
      </p>
      
      <button 
        className="permission-button"
        onClick={enableTestMode}
      >
        使用按钮模式
      </button>
      
      <div className="shake-tips">
        <p>💡 按钮模式：点击按钮代替摇动</p>
        <p>💡 功能完全相同，只是操作方式不同</p>
      </div>
    </div>
  );

  // 根据状态渲染不同内容
  const renderContent = () => {
    if (!sensorSupported) {
      return renderUnsupportedState();
    }

    // 如果有中奖结果，显示结果
    if (winners.length > 0) {
      return renderResultState();
    }

    switch (shakeStatus) {
      case 'waiting':
        return renderWaitingState();
      case 'shaking':
        return renderShakingState();
      case 'stopped':
        return renderStoppedState();
      default:
        return renderWaitingState();
    }
  };

  // 暴露方法给父组件
  useEffect(() => {
    // 将方法挂载到组件实例上，供外部调用
    (window as any).__shakePageMethods = {
      startShaking,
      stopShaking,
      handleLotteryResult,
    };

    return () => {
      delete (window as any).__shakePageMethods;
    };
  }, [startShaking, stopShaking, handleLotteryResult]);

  return (
    <div className="shake-page">
      {renderContent()}
    </div>
  );
};

export default ShakePage;
