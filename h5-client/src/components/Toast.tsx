/**
 * Toast通知组件 (H5端)
 * 显示轻量级的通知消息
 * 
 * 需求: 2.5, 5.6, 8.4, 8.5, 9.6 - 错误提示和用户通知
 */

import React, { useEffect, useState } from 'react';
import './Toast.css';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number; // 自动关闭时间（毫秒），0表示不自动关闭
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
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
    <div 
      className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      onClick={handleClose}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
    </div>
  );
};

/**
 * Toast容器组件
 * 管理多个Toast的显示
 */
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Toast Hook
 * 提供便捷的Toast管理功能
 */
let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${++toastId}`;
    const toast = { id, type, message, duration };
    setToasts((prev) => [...prev, toast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // 便捷方法
  const showError = (message: string, duration?: number) => showToast('error', message, duration);
  const showWarning = (message: string, duration?: number) => showToast('warning', message, duration);
  const showSuccess = (message: string, duration?: number) => showToast('success', message, duration);
  const showInfo = (message: string, duration?: number) => showToast('info', message, duration);

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
  };
};
