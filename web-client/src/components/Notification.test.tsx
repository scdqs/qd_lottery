/**
 * Notification组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Notification, NotificationContainer } from './Notification';

describe('Notification', () => {
  test('renders notification with correct type and message', () => {
    render(
      <Notification
        type="error"
        message="Test error message"
        duration={0}
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  test('renders different icons for different types', () => {
    const { rerender } = render(
      <Notification type="error" message="Error" duration={0} />
    );
    expect(screen.getByText('❌')).toBeInTheDocument();

    rerender(<Notification type="warning" message="Warning" duration={0} />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Notification type="success" message="Success" duration={0} />);
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<Notification type="info" message="Info" duration={0} />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  test('closes notification when close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Notification
        type="info"
        message="Test message"
        duration={0}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('关闭');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('auto-closes after duration', async () => {
    const onClose = jest.fn();
    render(
      <Notification
        type="info"
        message="Test message"
        duration={100}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('renders action button when provided', () => {
    const actionClick = jest.fn();
    render(
      <Notification
        type="info"
        message="Test message"
        duration={0}
        action={{
          label: 'Retry',
          onClick: actionClick,
        }}
      />
    );

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(actionClick).toHaveBeenCalled();
  });
});

describe('NotificationContainer', () => {
  test('renders multiple notifications', () => {
    const notifications = [
      { id: '1', type: 'error' as const, message: 'Error 1' },
      { id: '2', type: 'success' as const, message: 'Success 1' },
      { id: '3', type: 'info' as const, message: 'Info 1' },
    ];

    const onRemove = jest.fn();

    render(
      <NotificationContainer
        notifications={notifications}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Success 1')).toBeInTheDocument();
    expect(screen.getByText('Info 1')).toBeInTheDocument();
  });

  test('removes notification when onRemove is called', async () => {
    const notifications = [
      { id: '1', type: 'info' as const, message: 'Test message', duration: 0 },
    ];

    const onRemove = jest.fn();

    render(
      <NotificationContainer
        notifications={notifications}
        onRemove={onRemove}
      />
    );

    const closeButton = screen.getByLabelText('关闭');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith('1');
    }, { timeout: 500 });
  });
});
