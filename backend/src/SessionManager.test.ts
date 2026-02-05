/**
 * SessionManager 单元测试
 */

import { SessionManager } from './SessionManager';
import { Participant } from './types';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const session = sessionManager.createSession();

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.id.length).toBeGreaterThan(0);
    });

    it('should create session with correct initial state', () => {
      const session = sessionManager.createSession();

      expect(session.status).toBe('waiting');
      expect(session.participants.size).toBe(0);
      expect(session.shakeData.size).toBe(0);
      expect(session.webClient).toBeNull();
      expect(session.h5Clients.size).toBe(0);
      expect(session.createdAt).toBeGreaterThan(0);
    });

    it('should create multiple sessions with unique IDs', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const session3 = sessionManager.createSession();

      expect(session1.id).not.toBe(session2.id);
      expect(session1.id).not.toBe(session3.id);
      expect(session2.id).not.toBe(session3.id);
    });

    it('should use UUID format for session IDs', () => {
      const session = sessionManager.createSession();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(session.id).toMatch(uuidRegex);
    });
  });

  describe('getSession', () => {
    it('should return session by ID', () => {
      const session = sessionManager.createSession();
      const retrieved = sessionManager.getSession(session.id);

      expect(retrieved).toBe(session);
    });

    it('should return null for non-existent session', () => {
      const retrieved = sessionManager.getSession('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('addParticipant', () => {
    let sessionId: string;
    let participant: Participant;

    beforeEach(() => {
      const session = sessionManager.createSession();
      sessionId = session.id;
      participant = {
        userId: 'user123',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket123',
      };
    });

    it('should add participant to session', () => {
      const result = sessionManager.addParticipant(sessionId, participant);

      expect(result).toBe(true);
      const participants = sessionManager.getParticipants(sessionId);
      expect(participants).toHaveLength(1);
      expect(participants[0]).toEqual(participant);
    });

    it('should initialize shake data to 0 when adding participant', () => {
      sessionManager.addParticipant(sessionId, participant);

      const shakeCount = sessionManager.getShakeData(sessionId, participant.userId);
      expect(shakeCount).toBe(0);
    });

    it('should not add duplicate participant (same userId)', () => {
      sessionManager.addParticipant(sessionId, participant);

      const duplicateParticipant: Participant = {
        ...participant,
        nickname: '李四', // Different nickname but same userId
        socketId: 'socket456',
      };

      const result = sessionManager.addParticipant(sessionId, duplicateParticipant);

      expect(result).toBe(false);
      const participants = sessionManager.getParticipants(sessionId);
      expect(participants).toHaveLength(1);
      expect(participants[0].nickname).toBe('张三'); // Original participant unchanged
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.addParticipant('non-existent-id', participant);
      }).toThrow('Session non-existent-id not found');
    });

    it('should add multiple different participants', () => {
      const participant2: Participant = {
        userId: 'user456',
        nickname: '李四',
        avatarUrl: 'https://example.com/avatar2.jpg',
        joinedAt: Date.now(),
        socketId: 'socket456',
      };

      sessionManager.addParticipant(sessionId, participant);
      sessionManager.addParticipant(sessionId, participant2);

      const participants = sessionManager.getParticipants(sessionId);
      expect(participants).toHaveLength(2);
    });
  });

  describe('getParticipants', () => {
    it('should return empty array for session with no participants', () => {
      const session = sessionManager.createSession();
      const participants = sessionManager.getParticipants(session.id);

      expect(participants).toEqual([]);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.getParticipants('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('getParticipant', () => {
    it('should return specific participant by userId', () => {
      const session = sessionManager.createSession();
      const participant: Participant = {
        userId: 'user123',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket123',
      };

      sessionManager.addParticipant(session.id, participant);
      const retrieved = sessionManager.getParticipant(session.id, 'user123');

      expect(retrieved).toEqual(participant);
    });

    it('should return null for non-existent participant', () => {
      const session = sessionManager.createSession();
      const retrieved = sessionManager.getParticipant(session.id, 'non-existent-user');

      expect(retrieved).toBeNull();
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.getParticipant('non-existent-id', 'user123');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('updateShakeData', () => {
    let sessionId: string;
    let userId: string;

    beforeEach(() => {
      const session = sessionManager.createSession();
      sessionId = session.id;
      userId = 'user123';

      const participant: Participant = {
        userId,
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket123',
      };

      sessionManager.addParticipant(sessionId, participant);
    });

    it('should update shake data for participant', () => {
      sessionManager.updateShakeData(sessionId, userId, 10);

      const shakeCount = sessionManager.getShakeData(sessionId, userId);
      expect(shakeCount).toBe(10);
    });

    it('should update shake data multiple times', () => {
      sessionManager.updateShakeData(sessionId, userId, 5);
      sessionManager.updateShakeData(sessionId, userId, 15);
      sessionManager.updateShakeData(sessionId, userId, 25);

      const shakeCount = sessionManager.getShakeData(sessionId, userId);
      expect(shakeCount).toBe(25);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.updateShakeData('non-existent-id', userId, 10);
      }).toThrow('Session non-existent-id not found');
    });

    it('should allow shake data before participant is added', () => {
      const session = sessionManager.createSession();
      const preUserId = 'pre-user';
      sessionManager.updateShakeData(session.id, preUserId, 10);

      const participant: Participant = {
        userId: preUserId,
        nickname: '预注册用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket-pre',
      };

      sessionManager.addParticipant(session.id, participant);
      const shakeCount = sessionManager.getShakeData(session.id, preUserId);
      expect(shakeCount).toBe(10);
    });

    it('should throw error for negative shake count', () => {
      expect(() => {
        sessionManager.updateShakeData(sessionId, userId, -5);
      }).toThrow('Invalid shake count: -5');
    });

    it('should throw error for non-integer shake count', () => {
      expect(() => {
        sessionManager.updateShakeData(sessionId, userId, 10.5);
      }).toThrow('Invalid shake count: 10.5');
    });

    it('should accept zero as valid shake count', () => {
      sessionManager.updateShakeData(sessionId, userId, 0);

      const shakeCount = sessionManager.getShakeData(sessionId, userId);
      expect(shakeCount).toBe(0);
    });
  });

  describe('getShakeData', () => {
    it('should return 0 for participant with no shake data', () => {
      const session = sessionManager.createSession();
      const participant: Participant = {
        userId: 'user123',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket123',
      };

      sessionManager.addParticipant(session.id, participant);
      const shakeCount = sessionManager.getShakeData(session.id, 'user123');

      expect(shakeCount).toBe(0);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.getShakeData('non-existent-id', 'user123');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('getAllShakeData', () => {
    it('should return all shake data for session', () => {
      const session = sessionManager.createSession();

      const participant1: Participant = {
        userId: 'user1',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar1.jpg',
        joinedAt: Date.now(),
        socketId: 'socket1',
      };

      const participant2: Participant = {
        userId: 'user2',
        nickname: '李四',
        avatarUrl: 'https://example.com/avatar2.jpg',
        joinedAt: Date.now(),
        socketId: 'socket2',
      };

      sessionManager.addParticipant(session.id, participant1);
      sessionManager.addParticipant(session.id, participant2);
      sessionManager.updateShakeData(session.id, 'user1', 10);
      sessionManager.updateShakeData(session.id, 'user2', 20);

      const allShakeData = sessionManager.getAllShakeData(session.id);

      expect(allShakeData.size).toBe(2);
      expect(allShakeData.get('user1')).toBe(10);
      expect(allShakeData.get('user2')).toBe(20);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.getAllShakeData('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', () => {
      const session = sessionManager.createSession();

      sessionManager.updateSessionStatus(session.id, 'running');
      expect(sessionManager.getSession(session.id)?.status).toBe('running');

      sessionManager.updateSessionStatus(session.id, 'finished');
      expect(sessionManager.getSession(session.id)?.status).toBe('finished');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.updateSessionStatus('non-existent-id', 'running');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('calculateWinners', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = sessionManager.createSession();
      sessionId = session.id;
    });

    it('should calculate winners correctly with 3+ participants', () => {
      const participants: Participant[] = [
        {
          userId: 'user1',
          nickname: '张三',
          avatarUrl: 'https://example.com/avatar1.jpg',
          joinedAt: Date.now(),
          socketId: 'socket1',
        },
        {
          userId: 'user2',
          nickname: '李四',
          avatarUrl: 'https://example.com/avatar2.jpg',
          joinedAt: Date.now(),
          socketId: 'socket2',
        },
        {
          userId: 'user3',
          nickname: '王五',
          avatarUrl: 'https://example.com/avatar3.jpg',
          joinedAt: Date.now(),
          socketId: 'socket3',
        },
        {
          userId: 'user4',
          nickname: '赵六',
          avatarUrl: 'https://example.com/avatar4.jpg',
          joinedAt: Date.now(),
          socketId: 'socket4',
        },
      ];

      participants.forEach((p) => sessionManager.addParticipant(sessionId, p));

      sessionManager.updateShakeData(sessionId, 'user1', 50);
      sessionManager.updateShakeData(sessionId, 'user2', 30);
      sessionManager.updateShakeData(sessionId, 'user3', 70);
      sessionManager.updateShakeData(sessionId, 'user4', 40);

      const winners = sessionManager.calculateWinners(sessionId);

      expect(winners).toHaveLength(3);
      expect(winners[0]).toEqual({
        rank: 1,
        userId: 'user3',
        nickname: '王五',
        avatarUrl: 'https://example.com/avatar3.jpg',
        shakeCount: 70,
      });
      expect(winners[1]).toEqual({
        rank: 2,
        userId: 'user1',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar1.jpg',
        shakeCount: 50,
      });
      expect(winners[2]).toEqual({
        rank: 3,
        userId: 'user4',
        nickname: '赵六',
        avatarUrl: 'https://example.com/avatar4.jpg',
        shakeCount: 40,
      });
    });

    it('should handle less than 3 participants', () => {
      const participant: Participant = {
        userId: 'user1',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar1.jpg',
        joinedAt: Date.now(),
        socketId: 'socket1',
      };

      sessionManager.addParticipant(sessionId, participant);
      sessionManager.updateShakeData(sessionId, 'user1', 10);

      const winners = sessionManager.calculateWinners(sessionId);

      expect(winners).toHaveLength(1);
      expect(winners[0].rank).toBe(1);
    });

    it('should handle exactly 2 participants', () => {
      const participants: Participant[] = [
        {
          userId: 'user1',
          nickname: '张三',
          avatarUrl: 'https://example.com/avatar1.jpg',
          joinedAt: Date.now(),
          socketId: 'socket1',
        },
        {
          userId: 'user2',
          nickname: '李四',
          avatarUrl: 'https://example.com/avatar2.jpg',
          joinedAt: Date.now(),
          socketId: 'socket2',
        },
      ];

      participants.forEach((p) => sessionManager.addParticipant(sessionId, p));

      sessionManager.updateShakeData(sessionId, 'user1', 20);
      sessionManager.updateShakeData(sessionId, 'user2', 10);

      const winners = sessionManager.calculateWinners(sessionId);

      expect(winners).toHaveLength(2);
      expect(winners[0].rank).toBe(1);
      expect(winners[1].rank).toBe(2);
    });

    it('should return empty array for session with no participants', () => {
      const winners = sessionManager.calculateWinners(sessionId);

      expect(winners).toEqual([]);
    });

    it('should handle participants with same shake count', () => {
      const participants: Participant[] = [
        {
          userId: 'user1',
          nickname: '张三',
          avatarUrl: 'https://example.com/avatar1.jpg',
          joinedAt: Date.now(),
          socketId: 'socket1',
        },
        {
          userId: 'user2',
          nickname: '李四',
          avatarUrl: 'https://example.com/avatar2.jpg',
          joinedAt: Date.now(),
          socketId: 'socket2',
        },
      ];

      participants.forEach((p) => sessionManager.addParticipant(sessionId, p));

      sessionManager.updateShakeData(sessionId, 'user1', 10);
      sessionManager.updateShakeData(sessionId, 'user2', 10);

      const winners = sessionManager.calculateWinners(sessionId);

      expect(winners).toHaveLength(2);
      // Both should be included, order may vary but ranks should be assigned
      expect(winners[0].rank).toBe(1);
      expect(winners[1].rank).toBe(2);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.calculateWinners('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const session = sessionManager.createSession();
      const result = sessionManager.deleteSession(session.id);

      expect(result).toBe(true);
      expect(sessionManager.getSession(session.id)).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const result = sessionManager.deleteSession('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getAllSessionIds', () => {
    it('should return all session IDs', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();

      const sessionIds = sessionManager.getAllSessionIds();

      expect(sessionIds).toHaveLength(2);
      expect(sessionIds).toContain(session1.id);
      expect(sessionIds).toContain(session2.id);
    });

    it('should return empty array when no sessions exist', () => {
      const sessionIds = sessionManager.getAllSessionIds();

      expect(sessionIds).toEqual([]);
    });
  });

  describe('getSessionCount', () => {
    it('should return correct session count', () => {
      expect(sessionManager.getSessionCount()).toBe(0);

      sessionManager.createSession();
      expect(sessionManager.getSessionCount()).toBe(1);

      sessionManager.createSession();
      expect(sessionManager.getSessionCount()).toBe(2);
    });
  });

  describe('setWebClient', () => {
    it('should set web client socket ID', () => {
      const session = sessionManager.createSession();
      sessionManager.setWebClient(session.id, 'web-socket-123');

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.webClient).toBe('web-socket-123');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.setWebClient('non-existent-id', 'web-socket-123');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('addH5Client', () => {
    it('should add H5 client socket ID', () => {
      const session = sessionManager.createSession();
      sessionManager.addH5Client(session.id, 'h5-socket-123');

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.h5Clients.has('h5-socket-123')).toBe(true);
    });

    it('should add multiple H5 clients', () => {
      const session = sessionManager.createSession();
      sessionManager.addH5Client(session.id, 'h5-socket-1');
      sessionManager.addH5Client(session.id, 'h5-socket-2');

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.h5Clients.size).toBe(2);
      expect(retrieved?.h5Clients.has('h5-socket-1')).toBe(true);
      expect(retrieved?.h5Clients.has('h5-socket-2')).toBe(true);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.addH5Client('non-existent-id', 'h5-socket-123');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('removeH5Client', () => {
    it('should remove H5 client socket ID', () => {
      const session = sessionManager.createSession();
      sessionManager.addH5Client(session.id, 'h5-socket-123');
      sessionManager.removeH5Client(session.id, 'h5-socket-123');

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.h5Clients.has('h5-socket-123')).toBe(false);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.removeH5Client('non-existent-id', 'h5-socket-123');
      }).toThrow('Session non-existent-id not found');
    });
  });
});
