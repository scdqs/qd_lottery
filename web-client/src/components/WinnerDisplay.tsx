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

  // 获取名次标识
  const getRankLabel = (rank: 1 | 2 | 3): string => {
    switch (rank) {
      case 1:
        return '🥇 第一名';
      case 2:
        return '🥈 第二名';
      case 3:
        return '🥉 第三名';
    }
  };

  // 获取名次样式类
  const getRankClass = (rank: 1 | 2 | 3): string => {
    return `winner-card rank-${rank}`;
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
                src={winner.avatarUrl}
                alt={winner.nickname}
                className="winner-avatar"
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
