import { io, Socket } from 'socket.io-client';
import { ClientEvents, ServerEvents, WeChatUserInfo } from '../types';

/**
 * WebSocket客户端配置
 */
interface WebSocketConfig {
  url: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * WebSocket客户端类
 * 封装Socket.io客户端，提供连接管理、事件监听和自动重连功能
 */
export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private isManualDisconnect = false;
  private errorListeners: Array<(data: { message: string }) => void> = [];
  private pendingJoin: { sessionId: string; clientType: 'h5' } | null = null;
  private pendingUserInfo: { sessionId: string; userInfo: WeChatUserInfo } | null = null;
  private pendingShakeData:
    | { sessionId: string; userId: string; shakeCount: number }
    | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.reconnectionAttempts || 3;
  }

  /**
   * 连接到WebSocket服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.config.reconnectionDelay || 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

        // 连接成功
        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isManualDisconnect = false;
          this.flushPending();
          resolve();
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect after maximum attempts'));
          }
        });

        // 断开连接
        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          
          // 如果是服务器主动断开或网络问题，尝试重连
          if (!this.isManualDisconnect && reason !== 'io client disconnect') {
            this.handleReconnect();
          }
        });

        // 重连尝试
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}`);
        });

        // 重连失败
        this.socket.on('reconnect_failed', () => {
          console.error('Failed to reconnect after maximum attempts');
          reject(new Error('Reconnection failed'));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    } else {
      console.error('Maximum reconnection attempts reached');
      this.notifyError('连接已断开，请刷新页面重试');
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.isManualDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 加入会话
   */
  joinSession(sessionId: string): void {
    this.pendingJoin = { sessionId, clientType: 'h5' };
    this.emitIfConnected('join-session', this.pendingJoin);
  }

  /**
   * 发送用户授权信息
   */
  sendUserInfo(sessionId: string, userInfo: WeChatUserInfo): void {
    this.pendingUserInfo = { sessionId, userInfo };
    this.emitIfConnected('user-authorized', this.pendingUserInfo);
  }

  /**
   * 发送摇动数据
   */
  sendShakeData(sessionId: string, userId: string, shakeCount: number): void {
    this.pendingShakeData = { sessionId, userId, shakeCount };
    this.emitIfConnected('shake-data', this.pendingShakeData);
  }

  /**
   * 监听会话加入结果
   */
  onSessionJoined(callback: (data: {
    success: boolean;
    message?: string;
    sessionStatus?: 'waiting' | 'running' | 'finished';
    lotteryStartTime?: number;
    lotteryDuration?: number;
  }) => void): void {
    this.on('session-joined', callback);
  }

  /**
   * 监听抽奖开始事件
   */
  onLotteryStarted(callback: (data: { duration: number; startTime: number }) => void): void {
    this.on('lottery-started', callback);
  }

  /**
   * 监听抽奖停止事件
   */
  onLotteryStopped(callback: () => void): void {
    this.on('lottery-stopped', callback);
  }

  /**
   * 监听中奖结果
   */
  onLotteryResult(callback: (data: { winners: any[]; finalShakeData?: Record<string, number> }) => void): void {
    this.on('lottery-result', callback);
  }

  /**
   * 监听错误事件
   */
  onError(callback: (data: { message: string }) => void): void {
    this.errorListeners.push(callback);
    this.on('error', callback);
  }

  /**
   * 发送事件
   */
  private emitIfConnected(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  private notifyError(message: string): void {
    const payload = { message };
    for (const listener of this.errorListeners) {
      listener(payload);
    }
  }

  private flushPending(): void {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (this.pendingJoin) {
      this.socket.emit('join-session', this.pendingJoin);
    }
    if (this.pendingUserInfo) {
      this.socket.emit('user-authorized', this.pendingUserInfo);
    }
    if (this.pendingShakeData) {
      this.socket.emit('shake-data', this.pendingShakeData);
    }
  }

  /**
   * 监听事件
   */
  private on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * 获取Socket实例（用于测试）
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 创建单例实例
let wsClient: WebSocketClient | null = null;

/**
 * 获取WebSocket客户端实例
 */
export const getWebSocketClient = (url?: string): WebSocketClient => {
  if (!wsClient && url) {
    wsClient = new WebSocketClient({ url });
  }
  if (!wsClient) {
    throw new Error('WebSocket client not initialized. Please provide a URL.');
  }
  return wsClient;
};

/**
 * 重置WebSocket客户端实例（用于测试）
 */
export const resetWebSocketClient = (): void => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
};
