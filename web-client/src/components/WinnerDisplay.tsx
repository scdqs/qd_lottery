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

  // 获取名次勋章
  const getRankMedal = (rank: number): string => {
    const medals = ['', '🥇', '🥈', '🥉'];
    return medals[rank] || '🏆';
  };

  // 获取样式类
  const getRankClass = (rank: number): string => {
    return `winner-card rank-${rank}`;
  };

  return (
    <div className="winner-display">
      {/* <h2 className="winner-title">🎉 中奖名单 🎉</h2> */}
      <div className="winners-container">
        {winners.map((winner, index) => (
          <div
            key={winner.userId}
            className={getRankClass(winner.rank)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
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
              <div className="winner-nickname">{winner.nickname}</div>
              <div className="winner-shake-count">
                <span className="shake-icon">{getRankMedal(winner.rank)}</span>
                {/* 摇动次数  */}
                {winner.shakeCount}次
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
