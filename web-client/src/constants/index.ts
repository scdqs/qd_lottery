/**
 * 应用常量定义
 */

// WebSocket服务器地址
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// 默认抽奖配置
export const DEFAULT_LOTTERY_CONFIG = {
  duration: 30, // 默认30秒
  maxParticipants: 100,
  winnerCount: 3,
};

// 重连配置
export const RECONNECT_CONFIG = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
};

// UI更新延迟（毫秒）
export const UI_UPDATE_DELAY = {
  participantList: 500,
  shakeChart: 200,
};
