/**
 * WebSocket客户端服务测试
 * 测试连接管理、事件处理、自动重连和错误处理
 */

import { WebSocketClient, ConnectionStatus } from './websocket';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('WebSocketClient', () => {
  let mockSocket: any;
  let client: WebSocketClient;
  const testUrl = 'http://localhost:3000';

  beforeEach(() => {
    // 创建mock socket实例
    mockSocket = {
      connected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
    };

    // Mock io函数返回mock socket
    (io as jest.Mock).mockReturnValue(mockSocket);

    // 创建客户端实例
    client = new WebSocketClient({ url: testUrl });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('连接管理', () => {
    test('应该使用正确的配置创建socket连接', () => {
      client.connect();

      expect(io).toHaveBeenCalledWith(testUrl, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 20000,
      });
    });

    test('应该在连接时更新状态为connecting', () => {
      const statusListener = jest.fn();
      client.onStatusChange(statusListener);

      client.connect();

      expect(statusListener).toHaveBeenCalledWith('connecting');
    });

    test('应该在连接成功时更新状态为connected', () => {
      const statusListener = jest.fn();
      client.onStatusChange(statusListener);

      client.connect();

      // 模拟连接成功
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();

      expect(statusListener).toHaveBeenCalledWith('connected');
    });

    test('应该返回已存在的连接而不是创建新连接', () => {
      mockSocket.connected = true;
      client.connect();

      const firstSocket = client.getSocket();

      client.connect();
      const secondSocket = client.getSocket();

      expect(firstSocket).toBe(secondSocket);
      expect(io).toHaveBeenCalledTimes(1);
    });

    test('应该正确断开连接', () => {
      client.connect();
      client.disconnect();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(client.getSocket()).toBeNull();
      expect(client.getStatus()).toBe('disconnected');
    });

    test('应该在断开连接时重置重连计数', () => {
      const statusListener = jest.fn();
      client.onStatusChange(statusListener);

      client.connect();
      client.disconnect();

      // 重新连接应该从0开始计数
      client.connect();
      expect(statusListener).toHaveBeenCalledWith('connecting');
    });
  });

  describe('事件处理', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      client.connect();
    });

    test('应该能够发送事件到服务器', () => {
      const eventData = { sessionId: 'test-session', clientType: 'web' as const };
      client.emit('join-session', eventData);

      expect(mockSocket.emit).toHaveBeenCalledWith('join-session', eventData);
    });

    test('应该在未连接时不发送事件并记录错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSocket.connected = false;

      client.emit('join-session', { sessionId: 'test', clientType: 'web' });

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket is not connected. Cannot emit event:',
        'join-session'
      );

      consoleSpy.mockRestore();
    });

    test('应该能够监听服务器事件', () => {
      const handler = jest.fn();
      client.on('session-joined', handler);

      expect(mockSocket.on).toHaveBeenCalledWith('session-joined', handler);
    });

    test('应该返回取消监听的函数', () => {
      const handler = jest.fn();
      const unsubscribe = client.on('session-joined', handler);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('session-joined', handler);
    });

    test('应该能够监听一次性事件', () => {
      const handler = jest.fn();
      client.once('session-joined', handler);

      expect(mockSocket.once).toHaveBeenCalledWith('session-joined', handler);
    });

    test('应该能够移除事件监听器', () => {
      const handler = jest.fn();
      client.off('session-joined', handler);

      expect(mockSocket.off).toHaveBeenCalledWith('session-joined', handler);
    });
  });

  describe('自动重连逻辑', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('应该在断开连接时尝试重连', () => {
      const statusListener = jest.fn();
      client.onStatusChange(statusListener);
      client.connect();

      // 模拟断开连接
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');

      expect(statusListener).toHaveBeenCalledWith('reconnecting');
    });

    test('应该使用指数退避策略重连', () => {
      const statusListener = jest.fn();
      client.onStatusChange(statusListener);
      client.connect();

      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];

      // 第一次连接失败，触发第一次重连（1秒延迟）
      connectErrorHandler?.(new Error('Connection failed'));
      expect(statusListener).toHaveBeenCalledWith('reconnecting');

      // 验证延迟时间
      jest.advanceTimersByTime(999);
      expect(mockSocket.connect).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });

    test('应该在达到最大重连次数后停止重连', () => {
      const statusListener = jest.fn();
      
      // 创建一个自定义客户端，最大重连次数为0，便于测试
      const testClient = new WebSocketClient({
        url: testUrl,
        reconnectionAttempts: 0,
      });
      
      // 创建新的mock socket
      const testMockSocket = {
        connected: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
        removeAllListeners: jest.fn(),
      };
      
      (io as jest.Mock).mockReturnValueOnce(testMockSocket);
      
      testClient.onStatusChange(statusListener);
      testClient.connect();
      
      // 连接失败，由于最大重连次数为0，应该直接失败
      const connectErrorHandler = testMockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];
      connectErrorHandler?.(new Error('Connection failed'));
      
      expect(statusListener).toHaveBeenCalledWith('failed');
    });

    test('应该在连接成功后重置重连计数', () => {
      client.connect();

      // 第一次连接失败
      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];
      connectErrorHandler?.(new Error('Connection failed'));

      // 连接成功
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();

      // 再次失败应该从第一次重连开始
      connectErrorHandler?.(new Error('Connection failed'));
      jest.advanceTimersByTime(1000);
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('错误处理', () => {
    test('应该处理连接错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      client.connect();

      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];
      connectErrorHandler?.(new Error('Connection failed'));

      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket connection error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('应该处理连接超时', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      client.connect();

      const timeoutHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_timeout'
      )?.[1];
      timeoutHandler?.();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection timeout');

      consoleSpy.mockRestore();
    });

    test('应该处理通用错误事件', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      client.connect();

      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'error'
      )?.[1];
      errorHandler?.({ message: 'Test error' });

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', 'Test error');

      consoleSpy.mockRestore();
    });
  });

  describe('状态管理', () => {
    test('应该正确返回连接状态', () => {
      expect(client.getStatus()).toBe('disconnected');

      client.connect();
      expect(client.getStatus()).toBe('connecting');
    });

    test('应该正确检查是否已连接', () => {
      expect(client.isConnected()).toBe(false);

      mockSocket.connected = true;
      client.connect();
      expect(client.isConnected()).toBe(true);
    });

    test('应该能够添加和移除状态监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = client.onStatusChange(listener1);
      client.onStatusChange(listener2);

      client.connect();

      expect(listener1).toHaveBeenCalledWith('connecting');
      expect(listener2).toHaveBeenCalledWith('connecting');

      // 移除第一个监听器
      unsubscribe1();
      listener1.mockClear();
      listener2.mockClear();

      client.disconnect();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('disconnected');
    });

    test('应该在状态监听器抛出错误时继续执行其他监听器', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const listener1 = jest.fn(() => {
        throw new Error('Listener error');
      });
      const listener2 = jest.fn();

      client.onStatusChange(listener1);
      client.onStatusChange(listener2);

      client.connect();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in status listener:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('边缘情况', () => {
    test('应该处理socket为null时的事件监听', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = jest.fn();

      // 不调用connect，socket为null
      const newClient = new WebSocketClient({ url: testUrl });
      newClient.on('session-joined', handler);

      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket is not initialized. Cannot listen to event:',
        'session-joined'
      );

      consoleSpy.mockRestore();
    });

    test('应该处理socket为null时的一次性事件监听', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = jest.fn();

      const newClient = new WebSocketClient({ url: testUrl });
      newClient.once('session-joined', handler);

      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket is not initialized. Cannot listen to event:',
        'session-joined'
      );

      consoleSpy.mockRestore();
    });

    test('应该处理断开连接时socket为null的情况', () => {
      const newClient = new WebSocketClient({ url: testUrl });
      expect(() => newClient.disconnect()).not.toThrow();
    });

    test('应该处理移除事件监听器时socket为null的情况', () => {
      const newClient = new WebSocketClient({ url: testUrl });
      expect(() => newClient.off('session-joined')).not.toThrow();
    });

    test('应该使用自定义配置', () => {
      const customClient = new WebSocketClient({
        url: testUrl,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
      });

      customClient.connect();

      expect(io).toHaveBeenCalledWith(testUrl, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 30000,
      });
    });
  });
});
