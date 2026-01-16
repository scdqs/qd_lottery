/**
 * 通知组件
 * 显示各种类型的通知消息（错误、警告、成功、信息）
 * 
 * 需求: 8.4, 8.5 - 错误提示和用户通知
 */

import React, { useEffect, useState } from 'react';
import './Notification.css';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number; // 自动关闭时间（毫秒），0表示不自动关闭
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // 等待退出动画完成
  };

  const handleActionClick = () => {
    action?.onClick();
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`notification notification-${type} ${isExiting ? 'notification-exit' : ''}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        <p className="notification-message">{message}</p>
      </div>
      <div className="notification-actions">
        {action && (
          <button 
            className="notification-action-btn"
            onClick={handleActionClick}
          >
            {action.label}
          </button>
        )}
        <button 
          className="notification-close-btn"
          onClick={handleClose}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

/**
 * 通知容器组件
 * 管理多个通知的显示
 */
interface NotificationContainerProps {
  notifications: Array<NotificationProps & { id: string }>;
  onRemove: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};
