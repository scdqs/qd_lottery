/**
 * WebSocket客户端服务
 * 处理与后端的实时通信
 * 
 * 需求: 8.1, 8.4, 8.5
 */

import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types';

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * WebSocket连接状态
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

/**
 * WebSocket客户端配置
 */
export interface WebSocketConfig {
  url: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

/**
 * WebSocket客户端类
 * 封装Socket.io客户端，提供连接管理、事件监听、自动重连和错误处理
 */
export class WebSocketClient {
  private socket: SocketClient | null = null;
  private config: WebSocketConfig;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...config,
    };
    this.maxReconnectAttempts = this.config.reconnectionAttempts ?? 3;
  }

  /**
   * 连接到WebSocket服务器
   * 需求: 8.1 - 建立WebSocket连接
   */
  connect(): SocketClient {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.updateStatus('connecting');
    this.reconnectAttempts = 0;

    this.socket = io(this.config.url, {
      transports: ['websocket'],
      reconnection: false, // 我们自己处理重连逻辑
      timeout: this.config.timeout,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * 获取当前socket实例
   */
  getSocket(): SocketClient | null {
    return this.socket;
  }

  /**
   * 获取连接状态
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * 监听连接状态变化
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    // 返回取消监听的函数
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * 发送事件到服务器
   * 提供类型安全的事件发送方法
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket is not connected. Cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * 监听服务器事件
   * 提供类型安全的事件监听方法
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): () => void {
    if (!this.socket) {
      console.error('WebSocket is not initialized. Cannot listen to event:', event);
      return () => {};
    }
    this.socket.on(event, handler);
    // 返回取消监听的函数
    return () => {
      if (this.socket) {
        this.socket.off(event, handler);
      }
    };
  }

  /**
   * 监听服务器事件（一次性）
   */
  once<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.error('WebSocket is not initialized. Cannot listen to event:', event);
      return;
    }
    this.socket.once(event, handler);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  /**
   * 设置Socket.io内部事件处理器
   * 需求: 8.4, 8.5 - 自动重连和错误处理
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
    });

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.updateStatus('disconnected');

      // 如果是服务器主动断开或传输关闭，尝试重连
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect();
      }
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError();
    });

    // 连接超时
    this.socket.on('connect_timeout', () => {
      console.error('WebSocket connection timeout');
      this.handleConnectionError();
    });

    // 通用错误处理
    this.socket.on('error', (data: { message: string }) => {
      console.error('WebSocket error:', data.message);
    });
  }

  /**
   * 处理连接错误
   * 需求: 8.5 - 错误处理
   */
  private handleConnectionError(): void {
    if (this.connectionStatus === 'connecting') {
      // 首次连接失败
      this.attemptReconnect();
    }
  }

  /**
   * 尝试重新连接
   * 需求: 8.4 - 自动重连逻辑（指数退避策略）
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus('reconnecting');

    // 指数退避：1s, 2s, 4s
    const delay = Math.min(
      this.config.reconnectionDelay! * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectionDelayMax!
    );

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
    );

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * 更新连接状态并通知监听器
   */
  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}
