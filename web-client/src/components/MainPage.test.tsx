/**
 * MainPage 组件单元测试
 * 测试主页面的基本渲染和功能
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainPage } from './MainPage';
import { LotteryProvider } from '../context/LotteryContext';
import * as api from '../services/api';

// Mock API
jest.mock('../services/api');
const mockCreateSession = api.createSession as jest.MockedFunction<typeof api.createSession>;

// Mock WebSocket
jest.mock('../services/websocket', () => ({
  WebSocketClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
      connected: true,
    }),
    disconnect: jest.fn(),
    getSocket: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
    onStatusChange: jest.fn().mockReturnValue(() => {}),
  })),
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

describe('MainPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial state with create session button', () => {
    render(
      <LotteryProvider>
        <MainPage />
      </LotteryProvider>
    );

    expect(screen.getByText('公司抽奖系统')).toBeInTheDocument();
    expect(screen.getByText('未开始')).toBeInTheDocument();
    expect(screen.getByText('创建抽奖会话')).toBeInTheDocument();
  });

  test('creates session when button is clicked', async () => {
    const mockSessionInfo = {
      sessionId: 'test-session-123',
      qrCodeData: 'http://example.com/join?session=test-session-123',
      expiresAt: Date.now() + 3600000,
    };

    mockCreateSession.mockResolvedValue(mockSessionInfo);

    render(
      <LotteryProvider>
        <MainPage />
      </LotteryProvider>
    );

    const createButton = screen.getByText('创建抽奖会话');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('扫描二维码参与抽奖')).toBeInTheDocument();
    });
  });

  test('displays session info after creation', async () => {
    const mockSessionInfo = {
      sessionId: 'test-session-456',
      qrCodeData: 'http://example.com/join?session=test-session-456',
      expiresAt: Date.now() + 3600000,
    };

    mockCreateSession.mockResolvedValue(mockSessionInfo);

    render(
      <LotteryProvider>
        <MainPage />
      </LotteryProvider>
    );

    fireEvent.click(screen.getByText('创建抽奖会话'));

    await waitFor(() => {
      expect(screen.getByText(/会话ID:/)).toBeInTheDocument();
      expect(screen.getByText(/test-session-456/)).toBeInTheDocument();
    });
  });

  test('shows duration configuration input', async () => {
    const mockSessionInfo = {
      sessionId: 'test-session-789',
      qrCodeData: 'http://example.com/join?session=test-session-789',
      expiresAt: Date.now() + 3600000,
    };

    mockCreateSession.mockResolvedValue(mockSessionInfo);

    render(
      <LotteryProvider>
        <MainPage />
      </LotteryProvider>
    );

    fireEvent.click(screen.getByText('创建抽奖会话'));

    await waitFor(() => {
      const durationInput = screen.getByLabelText('抽奖时长（秒）:');
      expect(durationInput).toBeInTheDocument();
      expect(durationInput).toHaveValue(30); // 默认值
    });
  });

  test('allows changing duration configuration', async () => {
    const mockSessionInfo = {
      sessionId: 'test-session-999',
      qrCodeData: 'http://example.com/join?session=test-session-999',
      expiresAt: Date.now() + 3600000,
    };

    mockCreateSession.mockResolvedValue(mockSessionInfo);

    render(
      <LotteryProvider>
        <MainPage />
      </LotteryProvider>
    );

    fireEvent.click(screen.getByText('创建抽奖会话'));

    await waitFor(() => {
      const durationInput = screen.getByLabelText('抽奖时长（秒）:') as HTMLInputElement;
      fireEvent.change(durationInput, { target: { value: '60' } });
      expect(durationInput.value).toBe('60');
    });
  });
});
