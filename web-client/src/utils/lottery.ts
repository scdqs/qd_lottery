/**
 * 抽奖相关工具函数
 */

import { Participant, Winner } from '../types';

/**
 * 计算中奖者
 * 根据摇动次数选出前三名
 */
export function calculateWinners(
  participants: Participant[],
  shakeData: Map<string, number>
): Winner[] {
  // 创建参与者和摇动数据的组合数组
  const participantsWithShakes = participants
    .map((participant) => ({
      participant,
      shakeCount: shakeData.get(participant.userId) || 0,
    }))
    .filter((item) => item.shakeCount > 0); // 只包含有摇动数据的参与者

  // 按摇动次数降序排序
  participantsWithShakes.sort((a, b) => b.shakeCount - a.shakeCount);

  // 选出前三名（如果参与者少于3人，则为实际人数）
  const topThree = participantsWithShakes.slice(0, 3);

  // 转换为Winner格式
  const winners: Winner[] = topThree.map((item, index) => ({
    rank: (index + 1) as 1 | 2 | 3,
    userId: item.participant.userId,
    nickname: item.participant.nickname,
    avatarUrl: item.participant.avatarUrl,
    shakeCount: item.shakeCount,
  }));

  return winners;
}

/**
 * 格式化倒计时显示
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
