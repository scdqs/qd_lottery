/**
 * WebSocket服务器
 * 负责处理实时双向通信
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SessionManager } from './SessionManager';
import { Participant } from './types';

/**
 * 客户端类型
 */
export type ClientType = 'web' | 'h5';

/**
 * 客户端到服务器的事件
 */
export interface ClientToServerEvents {
  'join-session': (data: { sessionId: string; clientType: ClientType }) => void;
  'user-authorized': (data: { sessionId: string; userInfo: WeChatUserInfo }) => void;
  'start-lottery': (data: { sessionId: string; duration: number }) => void;
  'stop-lottery': (data: { sessionId: string }) => void;
  'shake-data': (data: { sessionId: string; userId: string; shakeCount: number }) => void;
}

/**
 * 服务器到客户端的事件
 */
export interface ServerToClientEvents {
  'session-joined': (data: {
    success: boolean;
    message?: string;
    sessionStatus?: 'waiting' | 'running' | 'finished';
    lotteryStartTime?: number;
    lotteryDuration?: number;
  }) => void;
  'participant-joined': (data: { participant: Participant }) => void;
  'lottery-started': (data: { duration: number; startTime: number }) => void;
  'lottery-stopped': () => void;
  'shake-update': (data: { userId: string; shakeCount: number }) => void;
  'lottery-result': (data: { winners: any[] }) => void;
  'error': (data: { message: string }) => void;
}

/**
 * 微信用户信息
 */
export interface WeChatUserInfo {
  openid: string;
  nickname: string;
  headimgurl: string;
  unionid?: string;
}

/**
 * Socket数据
 */
export interface SocketData {
  sessionId?: string;
  clientType?: ClientType;
  userId?: string;
}

/**
 * 配置WebSocket服务器
 * @param httpServer HTTP服务器实例
 * @param sessionManager 会话管理器实例
 * @returns Socket.IO服务器实例
 */
export function setupWebSocketServer(
  httpServer: HTTPServer,
  sessionManager: SessionManager
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
      },
    }
  );

  // 处理客户端连接
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) => {
    console.log('Client connected:', socket.id);

    // 处理加入会话事件
    socket.on('join-session', (data) => {
      handleJoinSession(socket, sessionManager, data);
    });

    // 处理用户授权事件
    socket.on('user-authorized', (data) => {
      handleUserAuthorized(socket, sessionManager, io, data);
    });

    // 处理开始抽奖事件
    socket.on('start-lottery', (data) => {
      handleStartLottery(socket, sessionManager, io, data);
    });

    // 处理停止抽奖事件
    socket.on('stop-lottery', (data) => {
      handleStopLottery(socket, sessionManager, io, data);
    });

    // 处理摇动数据事件
    socket.on('shake-data', (data) => {
      handleShakeData(socket, sessionManager, io, data);
    });

    // 处理客户端断开连接
    socket.on('disconnect', () => {
      handleDisconnect(socket, sessionManager);
    });
  });

  return io;
}

/**
 * 处理加入会话事件
 */
function handleJoinSession(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager,
  data: { sessionId: string; clientType: ClientType }
): void {
  const { sessionId, clientType } = data;

  try {
    // 验证会话是否存在
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('session-joined', {
        success: false,
        message: `Session ${sessionId} not found`,
      });
      return;
    }

    // 将客户端加入会话房间
    socket.join(sessionId);

    // 保存客户端信息到socket数据
    socket.data.sessionId = sessionId;
    socket.data.clientType = clientType;

    // 根据客户端类型更新会话信息
    if (clientType === 'web') {
      sessionManager.setWebClient(sessionId, socket.id);
    } else if (clientType === 'h5') {
      sessionManager.addH5Client(sessionId, socket.id);
    }

    // 发送成功响应，包含会话状态信息（用于处理中途加入的情况）
    socket.emit('session-joined', {
      success: true,
      sessionStatus: session.status,
      lotteryStartTime: session.lotteryStartTime,
      lotteryDuration: session.lotteryDuration,
    });

    console.log('Client joined session:', { socketId: socket.id, clientType, sessionId, sessionStatus: session.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    socket.emit('session-joined', {
      success: false,
      message: errorMessage,
    });
    console.error('Error joining session:', errorMessage);
  }
}

/**
 * 处理用户授权事件
 */
function handleUserAuthorized(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  data: { sessionId: string; userInfo: WeChatUserInfo }
): void {
  const { sessionId, userInfo } = data;

  try {
    // 验证会话是否存在
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: `Session ${sessionId} not found` });
      return;
    }

    // 创建参与者对象
    const participant: Participant = {
      userId: userInfo.openid,
      nickname: userInfo.nickname,
      avatarUrl: userInfo.headimgurl,
      joinedAt: Date.now(),
      socketId: socket.id,
    };

    // 添加参与者到会话（如果已存在则不会重复添加）
    const added = sessionManager.addParticipant(sessionId, participant);

    // 保存用户ID到socket数据
    socket.data.userId = userInfo.openid;

    // 如果是新参与者，向Web端广播参与者加入事件
    if (added && session.webClient) {
      io.to(session.webClient).emit('participant-joined', { participant });
      console.log('Participant joined session:', { nickname: participant.nickname, sessionId });
    } else if (!added) {
      console.log('Participant already in session:', { nickname: participant.nickname, sessionId });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    socket.emit('error', { message: errorMessage });
    console.error('Error handling user authorization:', errorMessage);
  }
}

/**
 * 处理开始抽奖事件
 */
function handleStartLottery(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  data: { sessionId: string; duration: number }
): void {
  const { sessionId, duration } = data;

  try {
    // 验证会话是否存在
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: `Session ${sessionId} not found` });
      return;
    }

    // 验证客户端是否为Web端
    if (socket.data.clientType !== 'web') {
      socket.emit('error', { message: 'Only web client can start lottery' });
      return;
    }

    // 记录开始时间和时长
    const startTime = Date.now();
    sessionManager.setLotteryTime(sessionId, startTime, duration);

    // 更新会话状态为运行中
    sessionManager.updateSessionStatus(sessionId, 'running');

    // 向该会话的所有客户端广播开始抽奖事件
    io.to(sessionId).emit('lottery-started', { duration, startTime });

    console.log('Lottery started in session:', { sessionId, duration, startTime });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    socket.emit('error', { message: errorMessage });
    console.error('Error starting lottery:', errorMessage);
  }
}

/**
 * 处理停止抽奖事件
 */
function handleStopLottery(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  data: { sessionId: string }
): void {
  const { sessionId } = data;

  try {
    // 验证会话是否存在
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: `Session ${sessionId} not found` });
      return;
    }

    // 验证客户端是否为Web端
    if (socket.data.clientType !== 'web') {
      socket.emit('error', { message: 'Only web client can stop lottery' });
      return;
    }

    // 更新会话状态为已结束
    sessionManager.updateSessionStatus(sessionId, 'finished');

    // 向该会话的所有客户端广播停止抽奖事件
    io.to(sessionId).emit('lottery-stopped');

    // 计算中奖者
    const winners = sessionManager.calculateWinners(sessionId);

    // 向该会话的所有客户端广播中奖结果
    io.to(sessionId).emit('lottery-result', { winners });

    console.log('Lottery stopped in session:', { sessionId, winners });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    socket.emit('error', { message: errorMessage });
    console.error('Error stopping lottery:', errorMessage);
  }
}

/**
 * 处理摇动数据事件
 */
function handleShakeData(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  data: { sessionId: string; userId: string; shakeCount: number }
): void {
  const { sessionId, userId, shakeCount } = data;

  try {
    // 验证会话是否存在
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: `Session ${sessionId} not found` });
      return;
    }

    // 更新摇动数据
    sessionManager.updateShakeData(sessionId, userId, shakeCount);

    // 只向Web端发送摇动数据更新（优化：避免向所有H5客户端广播，减少消息量）
    if (session.webClient) {
      io.to(session.webClient).emit('shake-update', { userId, shakeCount });
    }

    // 减少日志输出频率，只在每10次摇动时打印一次
    if (shakeCount % 10 === 0) {
      console.log('Shake data updated:', { sessionId, userId, shakeCount });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    socket.emit('error', { message: errorMessage });
    console.error('Error handling shake data:', errorMessage);
  }
}

/**
 * 处理客户端断开连接
 */
function handleDisconnect(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>,
  sessionManager: SessionManager
): void {
  const { sessionId, clientType } = socket.data;

  if (sessionId && clientType === 'h5') {
    try {
      // 从会话中移除H5客户端
      sessionManager.removeH5Client(sessionId, socket.id);
      console.log('H5 client disconnected:', { socketId: socket.id, sessionId });
    } catch (error) {
      console.error('Error removing H5 client:', error);
    }
  }

  console.log('Client disconnected:', socket.id);
}
