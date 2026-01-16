/**
 * ConnectionStatus组件测试
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionStatusIndicator } from './ConnectionStatus';

describe('ConnectionStatusIndicator', () => {
  test('does not render when status is connected', () => {
    const { container } = render(
      <ConnectionStatusIndicator status="connected" />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders connecting status', () => {
    render(<ConnectionStatusIndicator status="connecting" />);

    expect(screen.getByText('连接中...')).toBeInTheDocument();
  });

  test('renders reconnecting status', () => {
    render(<ConnectionStatusIndicator status="reconnecting" />);

    expect(screen.getByText('重新连接中...')).toBeInTheDocument();
  });

  test('renders disconnected status with actions', () => {
    const onReconnect = jest.fn();
    const onRefresh = jest.fn();

    render(
      <ConnectionStatusIndicator
        status="disconnected"
        onReconnect={onReconnect}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText('连接已断开')).toBeInTheDocument();
    expect(screen.getByText('重新连接')).toBeInTheDocument();
    expect(screen.getByText('刷新页面')).toBeInTheDocument();
  });

  test('renders failed status with message', () => {
    render(<ConnectionStatusIndicator status="failed" />);

    expect(screen.getByText('连接失败')).toBeInTheDocument();
    expect(screen.getByText(/重连失败超过3次/)).toBeInTheDocument();
  });

  test('calls onReconnect when reconnect button is clicked', () => {
    const onReconnect = jest.fn();

    render(
      <ConnectionStatusIndicator
        status="disconnected"
        onReconnect={onReconnect}
      />
    );

    const reconnectButton = screen.getByText('重新连接');
    fireEvent.click(reconnectButton);

    expect(onReconnect).toHaveBeenCalled();
  });

  test('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = jest.fn();

    render(
      <ConnectionStatusIndicator
        status="failed"
        onRefresh={onRefresh}
      />
    );

    const refreshButton = screen.getByText('刷新页面');
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  test('does not show reconnect button for failed status', () => {
    render(
      <ConnectionStatusIndicator
        status="failed"
        onReconnect={jest.fn()}
      />
    );

    expect(screen.queryByText('重新连接')).not.toBeInTheDocument();
  });
});
