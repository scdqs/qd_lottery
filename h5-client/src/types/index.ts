// 公司抽奖系统H5端类型定义

/**
 * 微信用户信息
 */
export interface WeChatUserInfo {
  openid: string;          // 微信openid
  nickname: string;        // 昵称
  headimgurl: string;      // 头像URL
  unionid?: string;        // unionid（可选）
}

/**
 * 参与者信息
 */
export interface Participant {
  userId: string;          // 微信openid
  nickname: string;        // 微信昵称
  avatarUrl: string;       // 微信头像URL
  joinedAt: number;        // 加入时间戳
  socketId: string;        // WebSocket连接ID
}

/**
 * 摇动数据
 */
export interface ShakeData {
  userId: string;          // 用户ID
  shakeCount: number;      // 累计摇动次数
  lastUpdateTime: number;  // 最后更新时间
}

/**
 * 中奖者信息
 */
export interface Winner {
  rank: 1 | 2 | 3;         // 名次
  userId: string;          // 用户ID
  nickname: string;        // 昵称
  avatarUrl: string;       // 头像URL
  shakeCount: number;      // 摇动次数
}

/**
 * 抽奖状态
 */
export type LotteryStatus = 'idle' | 'waiting' | 'running' | 'finished';

/**
 * 授权状态
 */
export type AuthStatus = 'pending' | 'authorizing' | 'success' | 'failed';

/**
 * 摇动状态
 */
export type ShakeStatus = 'waiting' | 'shaking' | 'stopped';

/**
 * WebSocket客户端事件
 */
export interface ClientEvents {
  'join-session': (data: { sessionId: string; clientType: 'web' | 'h5' }) => void;
  'user-authorized': (data: { sessionId: string; userInfo: WeChatUserInfo }) => void;
  'shake-data': (data: { sessionId: string; userId: string; shakeCount: number }) => void;
}

/**
 * WebSocket服务器事件
 */
export interface ServerEvents {
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
  'lottery-result': (data: { winners: Winner[]; finalShakeData?: Record<string, number> }) => void;
  'error': (data: { message: string }) => void;
}
