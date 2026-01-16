/**
 * 会话ID输入页面
 * 用于测试环境，允许用户手动输入会话ID
 */

import React, { useState } from 'react';
import './SessionInputPage.css';

interface SessionInputPageProps {
  onSubmit: (sessionId: string) => void;
}

export function SessionInputPage({ onSubmit }: SessionInputPageProps) {
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      setError('请输入会话ID');
      return;
    }

    // 验证会话ID格式（UUID格式）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId.trim())) {
      setError('会话ID格式不正确');
      return;
    }

    onSubmit(sessionId.trim());
  };

  return (
    <div className="session-input-page">
      <div className="session-input-container">
        <div className="logo">🎰</div>
        <h1>公司抽奖系统</h1>
        <p className="subtitle">请输入会话ID加入抽奖</p>

        <form onSubmit={handleSubmit} className="session-form">
          <div className="form-group">
            <label htmlFor="sessionId">会话ID</label>
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setError('');
              }}
              placeholder="例如: 1213d07b-f43d-4675-aaef-8bbf9c45e271"
              className="session-input"
            />
            {error && <p className="error-message">{error}</p>}
          </div>

          <button type="submit" className="submit-btn">
            加入抽奖
          </button>
        </form>

        <div className="help-text">
          <p>💡 提示：</p>
          <ul>
            <li>在电脑端创建抽奖会话后，可以看到会话ID</li>
            <li>或者扫描二维码自动加入</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
