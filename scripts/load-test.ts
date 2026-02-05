/**
 * 摇一摇压力测试脚本
 *
 * 模拟多个H5客户端同时连接并发送摇动数据
 *
 * 使用方法:
 *   npx ts-node scripts/load-test.ts <sessionId> [serverUrl]
 *
 * 参数:
 *   sessionId: 必需，会话ID
 *   serverUrl: 可选，服务器地址，默认 http://localhost:3000
 */

import { io, Socket } from 'socket.io-client';

// ============ 配置参数 ============
const CONFIG = {
  userCount: 100,           // 模拟用户数量
  shakeFrequencyMin: 5,     // 每秒最小摇动次数
  shakeFrequencyMax: 10,    // 每秒最大摇动次数
  testDuration: 30,         // 测试时长（秒）
  connectionTimeout: 10000, // 连接超时（毫秒）
  batchSize: 20,            // 每批连接数量（避免瞬间太多连接）
  batchDelay: 200,          // 批次间隔（毫秒）
};

// ============ 统计数据 ============
interface ConsistencyResult {
  userId: string;
  clientCount: number;
  serverCount: number;
  diff: number;
  isConsistent: boolean;
}

interface Stats {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalShakesSent: number;
  totalShakesAcknowledged: number;
  errors: string[];
  connectionTimes: number[];
  startTime: number;
  endTime: number;
  // 一致性统计
  consistencyResults: ConsistencyResult[];
  serverShakeData: Record<string, number> | null;
}

const stats: Stats = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  totalShakesSent: 0,
  totalShakesAcknowledged: 0,
  errors: [],
  connectionTimes: [],
  startTime: 0,
  endTime: 0,
  consistencyResults: [],
  serverShakeData: null,
};

// ============ 模拟客户端类 ============
class SimulatedClient {
  private socket: Socket | null = null;
  private visibleUserId: string;
  private sessionId: string;
  private serverUrl: string;
  private shakeCount: number = 0;
  private shakeInterval: NodeJS.Timeout | null = null;
  private isShaking: boolean = false;
  private connected: boolean = false;
  private onLotteryResult: ((data: { winners: any[]; finalShakeData?: Record<string, number> }) => void) | null = null;

  constructor(userId: string, sessionId: string, serverUrl: string) {
    this.visibleUserId = userId;
    this.sessionId = sessionId;
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          reconnection: false,
          timeout: CONFIG.connectionTimeout,
        });

        const timeoutId = setTimeout(() => {
          if (!this.connected) {
            stats.failedConnections++;
            stats.errors.push(`User ${this.visibleUserId}: Connection timeout`);
            this.socket?.disconnect();
            resolve(false);
          }
        }, CONFIG.connectionTimeout);

        this.socket.on('connect', () => {
          clearTimeout(timeoutId);
          this.connected = true;
          stats.successfulConnections++;
          stats.connectionTimes.push(Date.now() - startTime);

          // 加入会话
          this.socket!.emit('join-session', {
            sessionId: this.sessionId,
            clientType: 'h5',
          });
        });

        this.socket.on('session-joined', (data: { success: boolean; sessionStatus?: string }) => {
          if (data.success) {
            // 发送模拟用户信息
            this.socket!.emit('user-authorized', {
              sessionId: this.sessionId,
              userInfo: {
                openid: this.visibleUserId,
                nickname: `测试用户${this.visibleUserId.slice(-4)}`,
                headimgurl: 'https://example.com/avatar.png',
              },
            });

            // 如果抽奖已经开始，立即开始摇动
            if (data.sessionStatus === 'running') {
              this.startShaking();
            }

            resolve(true);
          } else {
            stats.failedConnections++;
            stats.errors.push(`User ${this.visibleUserId}: Failed to join session`);
            resolve(false);
          }
        });

        this.socket.on('lottery-started', () => {
          this.startShaking();
        });

        this.socket.on('lottery-stopped', () => {
          this.stopShaking();
        });

        this.socket.on('lottery-result', (data: { winners: any[]; finalShakeData?: Record<string, number> }) => {
          if (this.onLotteryResult) {
            this.onLotteryResult(data);
          }
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeoutId);
          if (!this.connected) {
            stats.failedConnections++;
            stats.errors.push(`User ${this.visibleUserId}: ${error.message}`);
            resolve(false);
          }
        });

        this.socket.on('error', (data: { message: string }) => {
          stats.errors.push(`User ${this.visibleUserId}: ${data.message}`);
        });

      } catch (error) {
        stats.failedConnections++;
        stats.errors.push(`User ${this.visibleUserId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        resolve(false);
      }
    });
  }

  setLotteryResultHandler(handler: (data: { winners: any[]; finalShakeData?: Record<string, number> }) => void): void {
    this.onLotteryResult = handler;
  }

  startShaking(): void {
    if (this.isShaking || !this.socket || !this.connected) return;

    this.isShaking = true;
    this.shakeCount = 0;

    // 随机摇动频率（每秒5-10次）
    const shakesPerSecond = Math.random() * (CONFIG.shakeFrequencyMax - CONFIG.shakeFrequencyMin) + CONFIG.shakeFrequencyMin;
    const intervalMs = 1000 / shakesPerSecond;

    this.shakeInterval = setInterval(() => {
      if (!this.isShaking || !this.socket || !this.connected) return;

      this.shakeCount++;
      stats.totalShakesSent++;

      this.socket.emit('shake-data', {
        sessionId: this.sessionId,
        userId: this.visibleUserId,
        shakeCount: this.shakeCount,
      });
    }, intervalMs);
  }

  stopShaking(): void {
    this.isShaking = false;
    if (this.shakeInterval) {
      clearInterval(this.shakeInterval);
      this.shakeInterval = null;
    }
  }

  disconnect(): void {
    this.stopShaking();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  getShakeCount(): number {
    return this.shakeCount;
  }

  getUserId(): string {
    return this.visibleUserId;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============ 主测试函数 ============
async function runLoadTest(sessionId: string, serverUrl: string): Promise<void> {
  console.log('\n========================================');
  console.log('       摇一摇压力测试');
  console.log('========================================\n');
  console.log(`服务器地址: ${serverUrl}`);
  console.log(`会话ID: ${sessionId}`);
  console.log(`模拟用户数: ${CONFIG.userCount}`);
  console.log(`摇动频率: ${CONFIG.shakeFrequencyMin}-${CONFIG.shakeFrequencyMax} 次/秒`);
  console.log(`测试时长: ${CONFIG.testDuration} 秒`);
  console.log('\n----------------------------------------\n');

  const clients: SimulatedClient[] = [];
  const clientShakeCounts: Map<string, number> = new Map();
  stats.startTime = Date.now();
  stats.totalConnections = CONFIG.userCount;

  // 分批创建连接
  console.log('🔌 正在建立连接...\n');

  for (let i = 0; i < CONFIG.userCount; i += CONFIG.batchSize) {
    const batchEnd = Math.min(i + CONFIG.batchSize, CONFIG.userCount);
    const batchPromises: Promise<boolean>[] = [];

    for (let j = i; j < batchEnd; j++) {
      const visibleUserId = `test_user_${j.toString().padStart(4, '0')}`;
      const client = new SimulatedClient(visibleUserId, sessionId, serverUrl);
      clients.push(client);

      // 设置抽奖结果处理器（用于获取服务器端的最终计数）
      client.setLotteryResultHandler((data) => {
        if (data.finalShakeData && !stats.serverShakeData) {
          stats.serverShakeData = data.finalShakeData;
        }
      });

      batchPromises.push(client.connect());
    }

    await Promise.all(batchPromises);

    const progress = Math.round((batchEnd / CONFIG.userCount) * 100);
    process.stdout.write(`\r连接进度: ${batchEnd}/${CONFIG.userCount} (${progress}%) - 成功: ${stats.successfulConnections}, 失败: ${stats.failedConnections}`);

    if (i + CONFIG.batchSize < CONFIG.userCount) {
      await sleep(CONFIG.batchDelay);
    }
  }

  console.log('\n\n----------------------------------------\n');
  console.log(`✅ 连接完成: ${stats.successfulConnections}/${CONFIG.userCount} 成功\n`);

  if (stats.successfulConnections === 0) {
    console.log('❌ 没有成功的连接，测试终止');
    printStats();
    return;
  }

  // 开始摇动测试
  console.log('🎲 开始摇动测试...');
  console.log('   (请在 Web 端点击"开始抽奖"按钮，或等待抽奖自动开始)\n');

  // 手动触发所有客户端开始摇动（用于测试）
  // 实际场景中应该等待服务器的 lottery-started 事件
  setTimeout(() => {
    console.log('📱 强制启动所有客户端摇动...\n');
    clients.forEach(client => {
      if (client.isConnected()) {
        client.startShaking();
      }
    });
  }, 2000);

  // 实时显示统计
  const displayInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
    const avgShakesPerSecond = elapsed > 0 ? Math.round(stats.totalShakesSent / elapsed) : 0;
    process.stdout.write(`\r⏱️  已运行: ${elapsed}s | 📤 总发送: ${stats.totalShakesSent} | 📊 平均: ${avgShakesPerSecond} 次/秒`);
  }, 1000);

  // 等待测试结束
  await sleep(CONFIG.testDuration * 1000);

  clearInterval(displayInterval);
  stats.endTime = Date.now();

  // 停止所有客户端并记录最终摇动次数
  console.log('\n\n🛑 停止摇动...\n');
  clients.forEach(client => {
    client.stopShaking();
    clientShakeCounts.set(client.getUserId(), client.getShakeCount());
  });

  // 等待一小段时间，让服务器处理最后的数据
  console.log('⏳ 等待服务器同步数据...\n');
  await sleep(1000);

  // 计算一致性
  calculateConsistency(clients, clientShakeCounts);

  // 断开所有连接
  console.log('🔌 断开连接...\n');
  clients.forEach(client => client.disconnect());

  // 打印统计结果
  printStats();
}

function calculateConsistency(clients: SimulatedClient[], clientShakeCounts: Map<string, number>): void {
  if (!stats.serverShakeData) {
    console.log('⚠️  未收到服务器端摇动数据，无法进行一致性评估');
    console.log('   （提示：需要在 Web 端点击"停止抽奖"按钮来触发服务器发送最终数据）\n');
    return;
  }

  clients.forEach(client => {
    const visibleUserId = client.getUserId();
    const clientCount = clientShakeCounts.get(visibleUserId) || 0;
    const serverCount = stats.serverShakeData![visibleUserId] || 0;
    const diff = Math.abs(clientCount - serverCount);
    const isConsistent = diff === 0;

    stats.consistencyResults.push({
      userId: visibleUserId,
      clientCount,
      serverCount,
      diff,
      isConsistent,
    });
  });
}

function printStats(): void {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const avgConnectionTime = stats.connectionTimes.length > 0
    ? Math.round(stats.connectionTimes.reduce((a, b) => a + b, 0) / stats.connectionTimes.length)
    : 0;
  const maxConnectionTime = stats.connectionTimes.length > 0
    ? Math.max(...stats.connectionTimes)
    : 0;
  const minConnectionTime = stats.connectionTimes.length > 0
    ? Math.min(...stats.connectionTimes)
    : 0;

  console.log('========================================');
  console.log('           测试结果统计');
  console.log('========================================\n');

  console.log('📊 连接统计:');
  console.log(`   总连接数: ${stats.totalConnections}`);
  console.log(`   成功连接: ${stats.successfulConnections} (${Math.round(stats.successfulConnections / stats.totalConnections * 100)}%)`);
  console.log(`   失败连接: ${stats.failedConnections} (${Math.round(stats.failedConnections / stats.totalConnections * 100)}%)`);
  console.log(`   平均连接时间: ${avgConnectionTime}ms`);
  console.log(`   最快连接时间: ${minConnectionTime}ms`);
  console.log(`   最慢连接时间: ${maxConnectionTime}ms`);

  console.log('\n📱 摇动统计:');
  console.log(`   测试时长: ${duration.toFixed(1)}秒`);
  console.log(`   总发送次数: ${stats.totalShakesSent}`);
  console.log(`   平均发送速率: ${Math.round(stats.totalShakesSent / duration)} 次/秒`);
  console.log(`   每用户平均: ${Math.round(stats.totalShakesSent / stats.successfulConnections)} 次`);

  // 一致性评估
  console.log('\n🔄 数据一致性评估:');
  if (stats.consistencyResults.length === 0) {
    console.log('   ⚠️  未能进行一致性评估（需要在Web端停止抽奖以获取服务器数据）');
  } else {
    const consistentCount = stats.consistencyResults.filter(r => r.isConsistent).length;
    const totalChecked = stats.consistencyResults.length;
    const consistencyRate = (consistentCount / totalChecked * 100).toFixed(1);

    // 计算差异统计
    const diffs = stats.consistencyResults.map(r => r.diff);
    const totalDiff = diffs.reduce((a, b) => a + b, 0);
    const avgDiff = (totalDiff / totalChecked).toFixed(2);
    const maxDiff = Math.max(...diffs);
    const minDiff = Math.min(...diffs);

    // 计算总发送和总接收
    const totalClientShakes = stats.consistencyResults.reduce((sum, r) => sum + r.clientCount, 0);
    const totalServerShakes = stats.consistencyResults.reduce((sum, r) => sum + r.serverCount, 0);
    const overallDiff = Math.abs(totalClientShakes - totalServerShakes);
    const overallLossRate = totalClientShakes > 0 ? ((totalClientShakes - totalServerShakes) / totalClientShakes * 100).toFixed(2) : '0';

    console.log(`   检查用户数: ${totalChecked}`);
    console.log(`   完全一致: ${consistentCount} (${consistencyRate}%)`);
    console.log(`   存在差异: ${totalChecked - consistentCount} (${(100 - parseFloat(consistencyRate)).toFixed(1)}%)`);
    console.log('');
    console.log(`   📈 差异统计:`);
    console.log(`      平均差异: ${avgDiff} 次/用户`);
    console.log(`      最大差异: ${maxDiff} 次`);
    console.log(`      最小差异: ${minDiff} 次`);
    console.log('');
    console.log(`   📊 总体数据:`);
    console.log(`      客户端总发送: ${totalClientShakes} 次`);
    console.log(`      服务端总记录: ${totalServerShakes} 次`);
    console.log(`      总差异: ${overallDiff} 次`);
    console.log(`      丢失率: ${overallLossRate}%`);

    // 显示差异最大的前5个用户
    if (maxDiff > 0) {
      console.log('\n   ⚠️  差异最大的用户 (前5):');
      const sortedByDiff = [...stats.consistencyResults].sort((a, b) => b.diff - a.diff);
      sortedByDiff.slice(0, 5).forEach((r, i) => {
        if (r.diff > 0) {
          console.log(`      ${i + 1}. ${r.userId}: 客户端=${r.clientCount}, 服务端=${r.serverCount}, 差异=${r.diff}`);
        }
      });
    }
  }

  if (stats.errors.length > 0) {
    console.log('\n❌ 错误信息 (前10条):');
    stats.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... 还有 ${stats.errors.length - 10} 条错误`);
    }
  }

  console.log('\n========================================\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ 入口 ============
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('用法: npx ts-node scripts/load-test.ts <sessionId> [serverUrl]');
  console.log('');
  console.log('参数:');
  console.log('  sessionId  - 必需，会话ID（从 Web 端创建）');
  console.log('  serverUrl  - 可选，服务器地址（默认: http://localhost:3000）');
  console.log('');
  console.log('示例:');
  console.log('  npx ts-node scripts/load-test.ts abc123');
  console.log('  npx ts-node scripts/load-test.ts abc123 http://your-server.com:3000');
  process.exit(1);
}

const sessionId = args[0];
const serverUrl = args[1] || 'http://localhost:3000';

runLoadTest(sessionId, serverUrl).catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
