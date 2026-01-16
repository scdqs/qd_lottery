/**
 * HTTP API服务
 * 处理与后端的HTTP通信
 */

import axios from 'axios';
import { SessionInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 创建抽奖会话
 */
export async function createSession(): Promise<SessionInfo> {
  const response = await apiClient.post<SessionInfo>('/api/session/create');
  return response.data;
}

/**
 * 获取会话信息
 */
export async function getSession(sessionId: string): Promise<{
  sessionId: string;
  status: string;
  participantCount: number;
}> {
  const response = await apiClient.get(`/api/session/${sessionId}`);
  return response.data;
}
