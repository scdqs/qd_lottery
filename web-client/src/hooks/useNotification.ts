/**
 * 通知管理Hook
 * 提供添加、移除通知的功能
 */

import { useState, useCallback } from 'react';
import { NotificationProps, NotificationType } from '../components/Notification';

interface NotificationWithId extends NotificationProps {
  id: string;
}

let notificationId = 0;

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    message: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = `notification-${++notificationId}`;
    const notification: NotificationWithId = {
      id,
      type,
      message,
      duration: options?.duration,
      action: options?.action,
    };

    setNotifications((prev) => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 便捷方法
  const showError = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    return addNotification('error', message, options);
  }, [addNotification]);

  const showWarning = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    return addNotification('warning', message, options);
  }, [addNotification]);

  const showSuccess = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    return addNotification('success', message, options);
  }, [addNotification]);

  const showInfo = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    return addNotification('info', message, options);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
  };
};
