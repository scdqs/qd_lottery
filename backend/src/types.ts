/**
 * 类型定义文件
 */

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
 * 会话状态
 */
export type SessionStatus = 'waiting' | 'running' | 'finished';

/**
 * 会话信息
 */
export interface Session {
  id: string;                              // 会话ID
  createdAt: number;                       // 创建时间戳
  status: SessionStatus;                   // 会话状态
  participants: Map<string, Participant>;  // 参与者映射（userId -> Participant）
  shakeData: Map<string, number>;          // 摇动数据（userId -> shakeCount）
  webClient: string | null;                // Web端客户端Socket ID
  h5Clients: Set<string>;                  // H5端客户端Socket ID集合
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
 * 微信用户信息
 */
export interface WeChatUserInfo {
  openid: string;          // 微信openid
  nickname: string;        // 昵称
  headimgurl: string;      // 头像URL
  unionid?: string;        // unionid（可选）
}
