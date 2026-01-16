/**
 * 公司抽奖系统 - Web端类型定义
 */

// 参与者信息
export interface Participant {
  userId: string;          // 微信openid
  nickname: string;        // 微信昵称
  avatarUrl: string;       // 微信头像URL
  joinedAt: number;        // 加入时间戳
  socketId: string;        // WebSocket连接ID
}

// 摇动数据
export interface ShakeData {
  userId: string;          // 用户ID
  shakeCount: number;      // 累计摇动次数
  lastUpdateTime: number;  // 最后更新时间
}

// 中奖者
export interface Winner {
  rank: 1 | 2 | 3;         // 名次
  userId: string;          // 用户ID
  nickname: string;        // 昵称
  avatarUrl: string;       // 头像URL
  shakeCount: number;      // 摇动次数
}

// 微信用户信息
export interface WeChatUserInfo {
  openid: string;          // 微信openid
  nickname: string;        // 昵称
  headimgurl: string;      // 头像URL
  unionid?: string;        // unionid（可选）
}

// 会话配置
export interface SessionConfig {
  duration: number;        // 抽奖时长（秒）
  maxParticipants: number; // 最大参与人数
  winnerCount: number;     // 中奖人数（默认3）
}

// 抽奖状态
export type LotteryStatus = 'idle' | 'waiting' | 'running' | 'finished';

// 会话信息
export interface SessionInfo {
  sessionId: string;
  qrCodeData: string;
  expiresAt: number;
}

// WebSocket事件类型定义

// 客户端 -> 服务器
export interface ClientToServerEvents {
  'join-session': (data: { sessionId: string; clientType: 'web' | 'h5' }) => void;
  'user-authorized': (data: { sessionId: string; userInfo: WeChatUserInfo }) => void;
  'start-lottery': (data: { sessionId: string; duration: number }) => void;
  'stop-lottery': (data: { sessionId: string }) => void;
  'shake-data': (data: { sessionId: string; userId: string; shakeCount: number }) => void;
}

// 服务器 -> 客户端
export interface ServerToClientEvents {
  'session-joined': (data: { success: boolean; message?: string }) => void;
  'participant-joined': (data: { participant: Participant }) => void;
  'lottery-started': (data: { duration: number; startTime: number }) => void;
  'lottery-stopped': () => void;
  'shake-update': (data: { userId: string; shakeCount: number }) => void;
  'lottery-result': (data: { winners: Winner[] }) => void;
  'error': (data: { message: string }) => void;
}
