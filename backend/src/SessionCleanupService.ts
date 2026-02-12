/**
 * Session Cleanup Service
 * Handles scheduled cleanup of expired sessions
 */

import { SessionManager } from './SessionManager';
import { Logger } from './utils/logger';

const logger = Logger.create('Cleanup');

export class SessionCleanupService {
  private sessionManager: SessionManager;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private expiryTimeMs: number;

  /**
   * Create a new SessionCleanupService
   * @param sessionManager The SessionManager instance to clean up
   * @param intervalMs Cleanup interval in milliseconds (default: 1 hour)
   * @param expiryTimeMs Session expiry time in milliseconds (default: 24 hours)
   */
  constructor(
    sessionManager: SessionManager,
    intervalMs: number = 60 * 60 * 1000, // 1 hour
    expiryTimeMs: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.sessionManager = sessionManager;
    this.intervalMs = intervalMs;
    this.expiryTimeMs = expiryTimeMs;
  }

  /**
   * Start the cleanup service
   * Runs cleanup immediately and then at regular intervals
   */
  start(): void {
    if (this.cleanupInterval) {
      logger.warn('清理服务已在运行中');
      return;
    }

    logger.info('清理服务已启动', { interval: `${this.intervalMs}ms`, expiry: `${this.expiryTimeMs}ms` });

    // Run cleanup immediately
    this.cleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.intervalMs);
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('清理服务已停止');
    }
  }

  /**
   * Perform cleanup of expired sessions
   * Deletes sessions that are older than the expiry time
   * @returns Number of sessions deleted
   */
  cleanup(): number {
    const now = Date.now();
    const sessionIds = this.sessionManager.getAllSessionIds();
    let deletedCount = 0;

    for (const sessionId of sessionIds) {
      const session = this.sessionManager.getSession(sessionId);
      
      if (!session) {
        continue;
      }

      // Check if session has expired
      const sessionAge = now - session.createdAt;
      if (sessionAge > this.expiryTimeMs) {
        // Delete expired session
        const deleted = this.sessionManager.deleteSession(sessionId);
        if (deleted) {
          deletedCount++;
          logger.info('删除过期会话', { sessionId, ageMinutes: Math.round(sessionAge / 1000 / 60) });
        }
      }
    }

    if (deletedCount > 0) {
      logger.info('过期会话清理完成', { deletedCount });
    }

    return deletedCount;
  }

  /**
   * Clean up finished sessions immediately
   * Deletes sessions with status 'finished'
   * @returns Number of sessions deleted
   */
  cleanupFinishedSessions(): number {
    const sessionIds = this.sessionManager.getAllSessionIds();
    let deletedCount = 0;

    for (const sessionId of sessionIds) {
      const session = this.sessionManager.getSession(sessionId);
      
      if (!session) {
        continue;
      }

      // Delete finished sessions
      if (session.status === 'finished') {
        const deleted = this.sessionManager.deleteSession(sessionId);
        if (deleted) {
          deletedCount++;
          logger.info('删除已完成会话', { sessionId });
        }
      }
    }

    if (deletedCount > 0) {
      logger.info('已完成会话清理完成', { deletedCount });
    }

    return deletedCount;
  }

  /**
   * Get cleanup statistics
   * @returns Object containing cleanup statistics
   */
  getStats(): {
    totalSessions: number;
    expiredSessions: number;
    finishedSessions: number;
  } {
    const now = Date.now();
    const sessionIds = this.sessionManager.getAllSessionIds();
    let expiredCount = 0;
    let finishedCount = 0;

    for (const sessionId of sessionIds) {
      const session = this.sessionManager.getSession(sessionId);
      
      if (!session) {
        continue;
      }

      const sessionAge = now - session.createdAt;
      if (sessionAge > this.expiryTimeMs) {
        expiredCount++;
      }

      if (session.status === 'finished') {
        finishedCount++;
      }
    }

    return {
      totalSessions: sessionIds.length,
      expiredSessions: expiredCount,
      finishedSessions: finishedCount,
    };
  }

  /**
   * Check if the cleanup service is running
   * @returns true if running, false otherwise
   */
  isRunning(): boolean {
    return this.cleanupInterval !== null;
  }
}
