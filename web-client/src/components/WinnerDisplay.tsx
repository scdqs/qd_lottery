/**
 * 中奖结果组件
 * 展示中奖者信息
 */

import { Winner } from '../types';
import './WinnerDisplay.css';

interface WinnerDisplayProps {
  winners: Winner[];
}

export function WinnerDisplay({ winners }: WinnerDisplayProps) {
  if (winners.length === 0) {
    return null;
  }

  // 获取名次标识（支持任意名次）
  const getRankLabel = (rank: number): string => {
    const medals = ['', '🥇', '🥈', '🥉'];
    const medal = medals[rank] || '🏆';
    return `${medal} 第${rank}名`;
  };

  // 获取名次样式类（前3名特殊样式，其余通用样式）
  const getRankClass = (rank: number): string => {
    if (rank <= 3) {
      return `winner-card rank-${rank}`;
    }
    return 'winner-card rank-other';
  };

  return (
    <div className="winner-display">
      <h2 className="winner-title">🎉 中奖名单 🎉</h2>
      <div className="winners-container">
        {winners.map((winner, index) => (
          <div
            key={winner.userId}
            className={getRankClass(winner.rank)}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="winner-rank-badge">
              {getRankLabel(winner.rank)}
            </div>
            <div className="winner-avatar-container">
              <img
                src={winner.avatarUrl || '/head.png'}
                alt={winner.nickname}
                className="winner-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/head.png';
                }}
              />
            </div>
            <div className="winner-info">
              <h3 className="winner-nickname">{winner.nickname}</h3>
              <p className="winner-shake-count">
                <span className="shake-icon">🎯</span>
                摇动次数: <strong>{winner.shakeCount}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
