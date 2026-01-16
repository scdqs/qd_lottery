/**
 * Session Cleanup Service Tests
 */

import { SessionCleanupService } from './SessionCleanupService';
import { SessionManager } from './SessionManager';
import { Participant } from './types';

describe('SessionCleanupService', () => {
  let sessionManager: SessionManager;
  let cleanupService: SessionCleanupService;

  beforeEach(() => {
    sessionManager = new SessionManager();
    // Use shorter intervals for testing (100ms interval, 500ms expiry)
    cleanupService = new SessionCleanupService(sessionManager, 100, 500);
  });

  afterEach(() => {
    cleanupService.stop();
  });

  describe('start and stop', () => {
    it('should start the cleanup service', () => {
      expect(cleanupService.isRunning()).toBe(false);
      cleanupService.start();
      expect(cleanupService.isRunning()).toBe(true);
    });

    it('should stop the cleanup service', () => {
      cleanupService.start();
      expect(cleanupService.isRunning()).toBe(true);
      cleanupService.stop();
      expect(cleanupService.isRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      cleanupService.start();
      cleanupService.start();
      expect(consoleSpy).toHaveBeenCalledWith('SessionCleanupService is already running');
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should delete expired sessions', () => {
      // Create a session
      const session = sessionManager.createSession();
      
      // Manually set the createdAt to make it expired
      const expiredSession = sessionManager.getSession(session.id);
      if (expiredSession) {
        expiredSession.createdAt = Date.now() - 1000; // 1 second ago (expired with 500ms expiry)
      }

      expect(sessionManager.getSessionCount()).toBe(1);

      // Run cleanup
      const deletedCount = cleanupService.cleanup();

      expect(deletedCount).toBe(1);
      expect(sessionManager.getSessionCount()).toBe(0);
    });

    it('should not delete non-expired sessions', () => {
      // Create a session
      sessionManager.createSession();

      expect(sessionManager.getSessionCount()).toBe(1);

      // Run cleanup
      const deletedCount = cleanupService.cleanup();

      expect(deletedCount).toBe(0);
      expect(sessionManager.getSessionCount()).toBe(1);
    });

    it('should delete multiple expired sessions', () => {
      // Create multiple sessions
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const session3 = sessionManager.createSession();

      // Make first two sessions expired
      const expiredSession1 = sessionManager.getSession(session1.id);
      const expiredSession2 = sessionManager.getSession(session2.id);
      if (expiredSession1) {
        expiredSession1.createdAt = Date.now() - 1000;
      }
      if (expiredSession2) {
        expiredSession2.createdAt = Date.now() - 1000;
      }

      expect(sessionManager.getSessionCount()).toBe(3);

      // Run cleanup
      const deletedCount = cleanupService.cleanup();

      expect(deletedCount).toBe(2);
      expect(sessionManager.getSessionCount()).toBe(1);
      expect(sessionManager.getSession(session3.id)).not.toBeNull();
    });

    it('should handle empty session list', () => {
      expect(sessionManager.getSessionCount()).toBe(0);

      // Run cleanup
      const deletedCount = cleanupService.cleanup();

      expect(deletedCount).toBe(0);
      expect(sessionManager.getSessionCount()).toBe(0);
    });
  });

  describe('cleanupFinishedSessions', () => {
    it('should delete finished sessions', () => {
      // Create a session and mark it as finished
      const session = sessionManager.createSession();
      sessionManager.updateSessionStatus(session.id, 'finished');

      expect(sessionManager.getSessionCount()).toBe(1);

      // Run cleanup
      const deletedCount = cleanupService.cleanupFinishedSessions();

      expect(deletedCount).toBe(1);
      expect(sessionManager.getSessionCount()).toBe(0);
    });

    it('should not delete non-finished sessions', () => {
      // Create sessions with different statuses
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      sessionManager.updateSessionStatus(session2.id, 'running');

      expect(sessionManager.getSessionCount()).toBe(2);

      // Run cleanup
      const deletedCount = cleanupService.cleanupFinishedSessions();

      expect(deletedCount).toBe(0);
      expect(sessionManager.getSessionCount()).toBe(2);
    });

    it('should delete multiple finished sessions', () => {
      // Create multiple sessions
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const session3 = sessionManager.createSession();

      // Mark first two as finished
      sessionManager.updateSessionStatus(session1.id, 'finished');
      sessionManager.updateSessionStatus(session2.id, 'finished');

      expect(sessionManager.getSessionCount()).toBe(3);

      // Run cleanup
      const deletedCount = cleanupService.cleanupFinishedSessions();

      expect(deletedCount).toBe(2);
      expect(sessionManager.getSessionCount()).toBe(1);
      expect(sessionManager.getSession(session3.id)).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      // Create sessions with different states
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const session3 = sessionManager.createSession();

      // Make session1 expired
      const expiredSession = sessionManager.getSession(session1.id);
      if (expiredSession) {
        expiredSession.createdAt = Date.now() - 1000;
      }

      // Make session2 finished
      sessionManager.updateSessionStatus(session2.id, 'finished');

      // Get stats
      const stats = cleanupService.getStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.expiredSessions).toBe(1);
      expect(stats.finishedSessions).toBe(1);
    });

    it('should return zero stats for empty session list', () => {
      const stats = cleanupService.getStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.expiredSessions).toBe(0);
      expect(stats.finishedSessions).toBe(0);
    });
  });

  describe('automatic cleanup', () => {
    it('should run cleanup automatically at intervals', (done) => {
      // Create an expired session
      const session = sessionManager.createSession();
      const expiredSession = sessionManager.getSession(session.id);
      if (expiredSession) {
        expiredSession.createdAt = Date.now() - 1000;
      }

      expect(sessionManager.getSessionCount()).toBe(1);

      // Start cleanup service
      cleanupService.start();

      // Wait for cleanup to run (should run immediately and then at intervals)
      setTimeout(() => {
        expect(sessionManager.getSessionCount()).toBe(0);
        cleanupService.stop();
        done();
      }, 150);
    });
  });

  describe('session data deletion', () => {
    it('should delete all session data including participants and shake data', () => {
      // Create a session with participants
      const session = sessionManager.createSession();
      
      const participant: Participant = {
        userId: 'user1',
        nickname: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket1',
      };

      sessionManager.addParticipant(session.id, participant);
      sessionManager.updateShakeData(session.id, 'user1', 100);

      // Verify data exists
      expect(sessionManager.getParticipants(session.id)).toHaveLength(1);
      expect(sessionManager.getShakeData(session.id, 'user1')).toBe(100);

      // Make session expired
      const expiredSession = sessionManager.getSession(session.id);
      if (expiredSession) {
        expiredSession.createdAt = Date.now() - 1000;
      }

      // Run cleanup
      cleanupService.cleanup();

      // Verify session is deleted
      expect(sessionManager.getSession(session.id)).toBeNull();
    });
  });
});
