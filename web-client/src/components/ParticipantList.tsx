/**
 * 参与者列表组件
 * 显示所有参与者的信息
 * 
 * 需求: 3.1, 3.2
 * - 实时显示参与者头像和昵称
 * - 实时更新参与者列表
 * - 处理新参与者加入事件
 */

import { Participant } from '../types';

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  // 如果没有参与者，显示空状态
  if (participants.length === 0) {
    return (
      <div className="participant-list">
        <h2>参与者列表 (0)</h2>
        <div className="participant-list-empty">
          <p>暂无参与者</p>
          <p className="hint">等待用户扫描二维码加入...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="participant-list">
      <h2>参与者列表 ({participants.length})</h2>
      <div className="participant-list-container">
        {participants.map((participant) => (
          <div 
            key={participant.userId} 
            className="participant-item"
            data-testid={`participant-${participant.userId}`}
          >
            <img
              src={participant.avatarUrl}
              alt={`${participant.nickname}的头像`}
              className="participant-avatar"
              onError={(e) => {
                // 头像加载失败时使用默认头像
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23ccc"/%3E%3Ctext x="24" y="30" font-size="20" text-anchor="middle" fill="%23fff"%3E?%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="participant-info">
              <p className="participant-nickname" title={participant.nickname}>
                {participant.nickname}
              </p>
              <p className="participant-status">
                <span className="status-indicator active"></span>
                在线
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
