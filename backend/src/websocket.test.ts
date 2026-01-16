/**
 * WebSocket服务器单元测试
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { SessionManager } from './SessionManager';
import { setupWebSocketServer, ClientToServerEvents, ServerToClientEvents } from './websocket';

describe('WebSocket Server', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let sessionManager: SessionManager;
  let serverPort: number;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = require('http').createServer();
    sessionManager = new SessionManager();
    io = setupWebSocketServer(httpServer, sessionManager);

    // Listen on random port
    httpServer.listen(() => {
      const address = httpServer.address();
      if (address && typeof address === 'object') {
        serverPort = address.port;
      }
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    // Create a new session for each test
    sessionManager.createSession();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Client Connection', () => {
    it('should accept client connection', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should handle client disconnection', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  describe('join-session Event', () => {
    it('should allow web client to join valid session', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      clientSocket.on('session-joined', (data) => {
        expect(data.success).toBe(true);
        expect(data.message).toBeUndefined();
        done();
      });
    });

    it('should allow h5 client to join valid session', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        expect(data.success).toBe(true);
        done();
      });
    });

    it('should reject join for non-existent session', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: 'non-existent-session',
          clientType: 'web',
        });
      });

      clientSocket.on('session-joined', (data) => {
        expect(data.success).toBe(false);
        expect(data.message).toContain('not found');
        done();
      });
    });

    it('should track web client in session', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          const updatedSession = sessionManager.getSession(session.id);
          expect(updatedSession?.webClient).toBeDefined();
          done();
        }
      });
    });

    it('should track h5 client in session', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          const updatedSession = sessionManager.getSession(session.id);
          expect(updatedSession?.h5Clients.size).toBeGreaterThan(0);
          done();
        }
      });
    });
  });

  describe('user-authorized Event', () => {
    it('should handle user authorization and add participant', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      const userInfo = {
        openid: 'test-openid-123',
        nickname: '测试用户',
        headimgurl: 'https://example.com/avatar.jpg',
      };

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('user-authorized', {
            sessionId: session.id,
            userInfo,
          });

          // Give it a moment to process
          setTimeout(() => {
            const participants = sessionManager.getParticipants(session.id);
            expect(participants).toHaveLength(1);
            expect(participants[0].userId).toBe(userInfo.openid);
            expect(participants[0].nickname).toBe(userInfo.nickname);
            expect(participants[0].avatarUrl).toBe(userInfo.headimgurl);
            done();
          }, 100);
        }
      });
    });

    it('should not add duplicate participant', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      const userInfo = {
        openid: 'test-openid-123',
        nickname: '测试用户',
        headimgurl: 'https://example.com/avatar.jpg',
      };

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          // Send authorization twice
          clientSocket.emit('user-authorized', {
            sessionId: session.id,
            userInfo,
          });

          setTimeout(() => {
            clientSocket.emit('user-authorized', {
              sessionId: session.id,
              userInfo,
            });

            setTimeout(() => {
              const participants = sessionManager.getParticipants(session.id);
              expect(participants).toHaveLength(1);
              done();
            }, 100);
          }, 100);
        }
      });
    });

    it('should emit error for non-existent session', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      const userInfo = {
        openid: 'test-openid-123',
        nickname: '测试用户',
        headimgurl: 'https://example.com/avatar.jpg',
      };

      clientSocket.on('connect', () => {
        clientSocket.emit('user-authorized', {
          sessionId: 'non-existent-session',
          userInfo,
        });
      });

      clientSocket.on('error', (data) => {
        expect(data.message).toContain('not found');
        done();
      });
    });
  });

  describe('start-lottery Event', () => {
    it('should start lottery and broadcast to all clients', (done) => {
      const session = sessionManager.createSession();
      const webClient = ioClient(`http://localhost:${serverPort}`);
      const h5Client = ioClient(`http://localhost:${serverPort}`);

      let webJoined = false;
      let h5Joined = false;
      let receivedCount = 0;

      const checkBothReceived = () => {
        receivedCount++;
        if (receivedCount === 2) {
          webClient.disconnect();
          h5Client.disconnect();
          done();
        }
      };

      webClient.on('connect', () => {
        webClient.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      h5Client.on('connect', () => {
        h5Client.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      webClient.on('session-joined', (data) => {
        if (data.success) {
          webJoined = true;
          if (webJoined && h5Joined) {
            webClient.emit('start-lottery', {
              sessionId: session.id,
              duration: 30,
            });
          }
        }
      });

      h5Client.on('session-joined', (data) => {
        if (data.success) {
          h5Joined = true;
          if (webJoined && h5Joined) {
            webClient.emit('start-lottery', {
              sessionId: session.id,
              duration: 30,
            });
          }
        }
      });

      webClient.on('lottery-started', (data) => {
        expect(data.duration).toBe(30);
        expect(data.startTime).toBeDefined();
        checkBothReceived();
      });

      h5Client.on('lottery-started', (data) => {
        expect(data.duration).toBe(30);
        expect(data.startTime).toBeDefined();
        checkBothReceived();
      });
    });

    it('should update session status to running', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('start-lottery', {
            sessionId: session.id,
            duration: 30,
          });
        }
      });

      clientSocket.on('lottery-started', () => {
        const updatedSession = sessionManager.getSession(session.id);
        expect(updatedSession?.status).toBe('running');
        done();
      });
    });

    it('should reject start-lottery from h5 client', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('start-lottery', {
            sessionId: session.id,
            duration: 30,
          });
        }
      });

      clientSocket.on('error', (data) => {
        expect(data.message).toContain('Only web client can start lottery');
        done();
      });
    });
  });

  describe('shake-data Event', () => {
    it('should update shake data and broadcast to all clients', (done) => {
      const session = sessionManager.createSession();
      const webClient = ioClient(`http://localhost:${serverPort}`);
      const h5Client = ioClient(`http://localhost:${serverPort}`);

      // Add a participant first
      const participant = {
        userId: 'test-user-123',
        nickname: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'test-socket',
      };
      sessionManager.addParticipant(session.id, participant);

      let webJoined = false;
      let h5Joined = false;

      webClient.on('connect', () => {
        webClient.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      h5Client.on('connect', () => {
        h5Client.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      webClient.on('session-joined', (data) => {
        if (data.success) {
          webJoined = true;
          if (webJoined && h5Joined) {
            h5Client.emit('shake-data', {
              sessionId: session.id,
              userId: 'test-user-123',
              shakeCount: 25,
            });
          }
        }
      });

      h5Client.on('session-joined', (data) => {
        if (data.success) {
          h5Joined = true;
          if (webJoined && h5Joined) {
            h5Client.emit('shake-data', {
              sessionId: session.id,
              userId: 'test-user-123',
              shakeCount: 25,
            });
          }
        }
      });

      webClient.on('shake-update', (data) => {
        expect(data.userId).toBe('test-user-123');
        expect(data.shakeCount).toBe(25);
        
        // Verify data was updated in session manager
        const shakeCount = sessionManager.getShakeData(session.id, 'test-user-123');
        expect(shakeCount).toBe(25);
        
        webClient.disconnect();
        h5Client.disconnect();
        done();
      });
    });

    it('should emit error for invalid shake count', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      // Add a participant first
      const participant = {
        userId: 'test-user-123',
        nickname: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'test-socket',
      };
      sessionManager.addParticipant(session.id, participant);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('shake-data', {
            sessionId: session.id,
            userId: 'test-user-123',
            shakeCount: -5,
          });
        }
      });

      clientSocket.on('error', (data) => {
        expect(data.message).toContain('Invalid shake count');
        done();
      });
    });
  });

  describe('stop-lottery Event', () => {
    it('should stop lottery, calculate winners, and broadcast results', (done) => {
      const session = sessionManager.createSession();
      const webClient = ioClient(`http://localhost:${serverPort}`);
      const h5Client = ioClient(`http://localhost:${serverPort}`);

      // Add participants with different shake counts
      const participants = [
        {
          userId: 'user-1',
          nickname: '第一名',
          avatarUrl: 'https://example.com/avatar1.jpg',
          joinedAt: Date.now(),
          socketId: 'socket-1',
        },
        {
          userId: 'user-2',
          nickname: '第二名',
          avatarUrl: 'https://example.com/avatar2.jpg',
          joinedAt: Date.now(),
          socketId: 'socket-2',
        },
        {
          userId: 'user-3',
          nickname: '第三名',
          avatarUrl: 'https://example.com/avatar3.jpg',
          joinedAt: Date.now(),
          socketId: 'socket-3',
        },
      ];

      participants.forEach((p) => sessionManager.addParticipant(session.id, p));
      sessionManager.updateShakeData(session.id, 'user-1', 100);
      sessionManager.updateShakeData(session.id, 'user-2', 80);
      sessionManager.updateShakeData(session.id, 'user-3', 60);

      let webJoined = false;
      let h5Joined = false;
      let receivedStoppedCount = 0;
      let receivedResultCount = 0;

      webClient.on('connect', () => {
        webClient.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      h5Client.on('connect', () => {
        h5Client.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      webClient.on('session-joined', (data) => {
        if (data.success) {
          webJoined = true;
          if (webJoined && h5Joined) {
            webClient.emit('stop-lottery', {
              sessionId: session.id,
            });
          }
        }
      });

      h5Client.on('session-joined', (data) => {
        if (data.success) {
          h5Joined = true;
          if (webJoined && h5Joined) {
            webClient.emit('stop-lottery', {
              sessionId: session.id,
            });
          }
        }
      });

      const checkComplete = () => {
        if (receivedStoppedCount === 2 && receivedResultCount === 2) {
          webClient.disconnect();
          h5Client.disconnect();
          done();
        }
      };

      webClient.on('lottery-stopped', () => {
        receivedStoppedCount++;
        checkComplete();
      });

      h5Client.on('lottery-stopped', () => {
        receivedStoppedCount++;
        checkComplete();
      });

      webClient.on('lottery-result', (data) => {
        expect(data.winners).toHaveLength(3);
        expect(data.winners[0].rank).toBe(1);
        expect(data.winners[0].userId).toBe('user-1');
        expect(data.winners[0].shakeCount).toBe(100);
        expect(data.winners[1].rank).toBe(2);
        expect(data.winners[1].userId).toBe('user-2');
        expect(data.winners[2].rank).toBe(3);
        expect(data.winners[2].userId).toBe('user-3');
        receivedResultCount++;
        checkComplete();
      });

      h5Client.on('lottery-result', (data) => {
        expect(data.winners).toHaveLength(3);
        receivedResultCount++;
        checkComplete();
      });
    });

    it('should update session status to finished', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      // Add a participant
      const participant = {
        userId: 'user-1',
        nickname: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinedAt: Date.now(),
        socketId: 'socket-1',
      };
      sessionManager.addParticipant(session.id, participant);
      sessionManager.updateShakeData(session.id, 'user-1', 50);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'web',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('stop-lottery', {
            sessionId: session.id,
          });
        }
      });

      clientSocket.on('lottery-result', () => {
        const updatedSession = sessionManager.getSession(session.id);
        expect(updatedSession?.status).toBe('finished');
        done();
      });
    });

    it('should reject stop-lottery from h5 client', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          clientSocket.emit('stop-lottery', {
            sessionId: session.id,
          });
        }
      });

      clientSocket.on('error', (data) => {
        expect(data.message).toContain('Only web client can stop lottery');
        done();
      });
    });
  });

  describe('Client Disconnection', () => {
    it('should remove h5 client from session on disconnect', (done) => {
      const session = sessionManager.createSession();
      clientSocket = ioClient(`http://localhost:${serverPort}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('join-session', {
          sessionId: session.id,
          clientType: 'h5',
        });
      });

      clientSocket.on('session-joined', (data) => {
        if (data.success) {
          const beforeDisconnect = sessionManager.getSession(session.id);
          expect(beforeDisconnect?.h5Clients.size).toBeGreaterThan(0);

          clientSocket.disconnect();

          setTimeout(() => {
            const afterDisconnect = sessionManager.getSession(session.id);
            expect(afterDisconnect?.h5Clients.size).toBe(0);
            done();
          }, 100);
        }
      });
    });
  });
});
