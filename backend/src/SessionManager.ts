/**
 * 会话管理器
 * 负责管理抽奖会话的生命周期和数据
 */

import { v4 as uuidv4 } from 'uuid';
import { Session, Participant, Winner, SessionStatus } from './types';

export class SessionManager {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * 创建新的抽奖会话
   * @returns 新创建的会话对象
   */
  createSession(): Session {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      status: 'waiting',
      participants: new Map(),
      shakeData: new Map(),
      webClient: null,
      h5Clients: new Set(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取指定的会话
   * @param sessionId 会话ID
   * @returns 会话对象，如果不存在则返回null
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 添加参与者到会话
   * 如果参与者已存在（相同userId），则不会重复添加
   * @param sessionId 会话ID
   * @param participant 参与者信息
   * @returns 是否成功添加（如果已存在则返回false）
   */
  addParticipant(sessionId: string, participant: Participant): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 检查参与者是否已存在（基于userId去重）
    if (session.participants.has(participant.userId)) {
      return false;
    }

    // 添加参与者
    session.participants.set(participant.userId, participant);
    
    // 初始化摇动数据为0（如已有预存数据则保留）
    if (!session.shakeData.has(participant.userId)) {
      session.shakeData.set(participant.userId, 0);
    }

    return true;
  }

  /**
   * 查询会话中的所有参与者
   * @param sessionId 会话ID
   * @returns 参与者数组
   */
  getParticipants(sessionId: string): Participant[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return Array.from(session.participants.values());
  }

  /**
   * 查询指定参与者
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @returns 参与者信息，如果不存在则返回null
   */
  getParticipant(sessionId: string, userId: string): Participant | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.participants.get(userId) || null;
  }

  /**
   * 更新参与者的摇动数据
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param shakeCount 摇动次数
   */
  updateShakeData(sessionId: string, userId: string, shakeCount: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 验证摇动次数为非负整数
    if (!Number.isInteger(shakeCount) || shakeCount < 0) {
      throw new Error(`Invalid shake count: ${shakeCount}`);
    }

    session.shakeData.set(userId, shakeCount);
  }

  /**
   * 获取参与者的摇动数据
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @returns 摇动次数
   */
  getShakeData(sessionId: string, userId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.shakeData.get(userId) || 0;
  }

  /**
   * 获取所有摇动数据
   * @param sessionId 会话ID
   * @returns 摇动数据映射
   */
  getAllShakeData(sessionId: string): Map<string, number> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return new Map(session.shakeData);
  }

  /**
   * 更新会话状态
   * @param sessionId 会话ID
   * @param status 新状态
   */
  updateSessionStatus(sessionId: string, status: SessionStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = status;
  }

  /**
   * 计算中奖者
   * 根据摇动次数选出前三名（如果参与者少于三人，则为实际人数）
   * @param sessionId 会话ID
   * @returns 中奖者数组，按名次排序
   */
  calculateWinners(sessionId: string): Winner[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 获取所有参与者及其摇动数据
    const participantsWithShakes = Array.from(session.participants.values()).map(
      (participant) => ({
        participant,
        shakeCount: session.shakeData.get(participant.userId) || 0,
      })
    );

    // 按摇动次数降序排序
    participantsWithShakes.sort((a, b) => b.shakeCount - a.shakeCount);

    // 选出前三名（或实际人数）
    const winnerCount = Math.min(3, participantsWithShakes.length);
    const winners: Winner[] = [];

    for (let i = 0; i < winnerCount; i++) {
      const { participant, shakeCount } = participantsWithShakes[i];
      winners.push({
        rank: (i + 1) as 1 | 2 | 3,
        userId: participant.userId,
        nickname: participant.nickname,
        avatarUrl: participant.avatarUrl,
        shakeCount,
      });
    }

    return winners;
  }

  /**
   * 删除会话
   * @param sessionId 会话ID
   * @returns 是否成功删除
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 获取所有会话ID
   * @returns 会话ID数组
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 获取会话数量
   * @returns 会话数量
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 设置Web客户端Socket ID
   * @param sessionId 会话ID
   * @param socketId Socket ID
   */
  setWebClient(sessionId: string, socketId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.webClient = socketId;
  }

  /**
   * 添加H5客户端Socket ID
   * @param sessionId 会话ID
   * @param socketId Socket ID
   */
  addH5Client(sessionId: string, socketId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.h5Clients.add(socketId);
  }

  /**
   * 移除H5客户端Socket ID
   * @param sessionId 会话ID
   * @param socketId Socket ID
   */
  removeH5Client(sessionId: string, socketId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.h5Clients.delete(socketId);
  }

  /**
   * 设置抽奖开始时间和时长
   * @param sessionId 会话ID
   * @param startTime 开始时间戳
   * @param duration 抽奖时长（秒）
   */
  setLotteryTime(sessionId: string, startTime: number, duration: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.lotteryStartTime = startTime;
    session.lotteryDuration = duration;
  }
}
