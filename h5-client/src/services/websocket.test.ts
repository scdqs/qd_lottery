import { WebSocketClient, resetWebSocketClient } from './websocket';
import { WeChatUserInfo } from '../types';

// Mock socket.io-client
let mockSocket: any;

jest.mock('socket.io-client', () => {
  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    resetWebSocketClient();
    
    // Create fresh mock socket for each test
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    
    client = new WebSocketClient({ url: 'http://localhost:3000' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetWebSocketClient();
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      const connectPromise = client.connect();
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      await expect(connectPromise).resolves.toBeUndefined();
    });

    it('should handle connection errors', async () => {
      const connectPromise = client.connect();
      
      // Simulate connection error multiple times
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
        errorHandler(new Error('Connection failed'));
        errorHandler(new Error('Connection failed'));
      }

      await expect(connectPromise).rejects.toThrow('Failed to connect after maximum attempts');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from server', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      // Then disconnect
      client.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('joinSession', () => {
    it('should emit join-session event with correct data', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const sessionId = 'test-session-123';
      client.joinSession(sessionId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-session', {
        sessionId,
        clientType: 'h5',
      });
    });

    it('should not emit when socket is not connected', () => {
      mockSocket.connected = false;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      client.joinSession('test-session');
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Cannot emit event: socket not connected');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendUserInfo', () => {
    it('should emit user-authorized event with correct data', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const sessionId = 'test-session-123';
      const userInfo: WeChatUserInfo = {
        openid: 'test-openid',
        nickname: 'Test User',
        headimgurl: 'http://example.com/avatar.jpg',
      };
      
      client.sendUserInfo(sessionId, userInfo);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('user-authorized', {
        sessionId,
        userInfo,
      });
    });
  });

  describe('sendShakeData', () => {
    it('should emit shake-data event with correct data', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const sessionId = 'test-session-123';
      const userId = 'test-user-id';
      const shakeCount = 42;
      
      client.sendShakeData(sessionId, userId, shakeCount);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('shake-data', {
        sessionId,
        userId,
        shakeCount,
      });
    });
  });

  describe('event listeners', () => {
    it('should register onSessionJoined listener', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const callback = jest.fn();
      client.onSessionJoined(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('session-joined', callback);
    });

    it('should register onLotteryStarted listener', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const callback = jest.fn();
      client.onLotteryStarted(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('lottery-started', callback);
    });

    it('should register onLotteryStopped listener', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const callback = jest.fn();
      client.onLotteryStopped(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('lottery-stopped', callback);
    });

    it('should register onLotteryResult listener', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const callback = jest.fn();
      client.onLotteryResult(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('lottery-result', callback);
    });

    it('should register onError listener', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      const callback = jest.fn();
      client.onError(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('error', callback);
    });
  });

  describe('isConnected', () => {
    it('should return true when socket is connected', async () => {
      // First connect
      const connectPromise = client.connect();
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }
      await connectPromise;
      
      expect(client.isConnected()).toBe(true);
    });

    it('should return false when socket is not connected', () => {
      mockSocket.connected = false;
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('reconnection logic', () => {
    it('should handle disconnect and attempt reconnection', async () => {
      const connectPromise = client.connect();
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      await connectPromise;

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )?.[1];
      
      if (disconnectHandler) {
        mockSocket.connected = false;
        disconnectHandler('transport close');
      }

      // Verify reconnection attempt is logged
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
    });

    it('should not reconnect on manual disconnect', async () => {
      const connectPromise = client.connect();
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        mockSocket.connected = true;
        connectHandler();
      }

      await connectPromise;

      // Manual disconnect
      client.disconnect();

      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )?.[1];
      
      if (disconnectHandler) {
        mockSocket.connected = false;
        disconnectHandler('io client disconnect');
      }

      // Should not attempt reconnection
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });
});
