/**
 * 连接状态指示器组件
 * 显示WebSocket连接状态和重连提示
 * 
 * 需求: 8.4, 8.5 - WebSocket断线重连提示
 */

import React from 'react';
import { ConnectionStatus as Status } from '../services/websocket';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  status: Status;
  onReconnect?: () => void;
  onRefresh?: () => void;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
  onRefresh,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '✓',
          text: '已连接',
          className: 'connected',
          showActions: false,
        };
      case 'connecting':
        return {
          icon: '⟳',
          text: '连接中...',
          className: 'connecting',
          showActions: false,
        };
      case 'reconnecting':
        return {
          icon: '⟳',
          text: '重新连接中...',
          className: 'reconnecting',
          showActions: false,
        };
      case 'disconnected':
        return {
          icon: '⚠',
          text: '连接已断开',
          className: 'disconnected',
          showActions: true,
        };
      case 'failed':
        return {
          icon: '✕',
          text: '连接失败',
          className: 'failed',
          showActions: true,
        };
      default:
        return {
          icon: '?',
          text: '未知状态',
          className: 'unknown',
          showActions: false,
        };
    }
  };

  const config = getStatusConfig();

  // 只在非连接状态时显示
  if (status === 'connected') {
    return null;
  }

  return (
    <div className={`connection-status connection-status-${config.className}`}>
      <div className="connection-status-content">
        <span className="connection-status-icon">{config.icon}</span>
        <span className="connection-status-text">{config.text}</span>
      </div>
      
      {config.showActions && (
        <div className="connection-status-actions">
          {status === 'failed' && (
            <p className="connection-status-message">
              重连失败超过3次，请刷新页面重试
            </p>
          )}
          {onReconnect && status === 'disconnected' && (
            <button 
              className="connection-status-btn btn-reconnect"
              onClick={onReconnect}
            >
              重新连接
            </button>
          )}
          {onRefresh && (
            <button 
              className="connection-status-btn btn-refresh"
              onClick={onRefresh}
            >
              刷新页面
            </button>
          )}
        </div>
      )}
    </div>
  );
};
