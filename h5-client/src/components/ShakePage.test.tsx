import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShakePage from './ShakePage';
import { AppProvider } from '../context/AppContext';
import { ShakeSensor } from '../services/ShakeSensor';

// Mock ShakeSensor
jest.mock('../services/ShakeSensor');

describe('ShakePage', () => {
  const mockSessionId = 'test-session-123';
  const mockUserId = 'test-user-456';
  const mockOnShakeCountUpdate = jest.fn();

  let mockSensor: any;

  beforeEach(() => {
    mockSensor = {
      isSupported: jest.fn().mockReturnValue(true),
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
      getShakeCount: jest.fn().mockReturnValue(0),
      isActive: jest.fn().mockReturnValue(false),
    };

    (ShakeSensor as jest.Mock).mockImplementation(() => mockSensor);
    
    // Mock DeviceMotionEvent
    global.DeviceMotionEvent = jest.fn() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderShakePage = () => {
    return render(
      <AppProvider>
        <ShakePage
          sessionId={mockSessionId}
          userId={mockUserId}
          onShakeCountUpdate={mockOnShakeCountUpdate}
        />
      </AppProvider>
    );
  };

  describe('Waiting State', () => {
    it('should render waiting state by default', () => {
      renderShakePage();

      expect(screen.getByText('准备就绪')).toBeInTheDocument();
      expect(screen.getByText('等待活动开始...')).toBeInTheDocument();
      expect(screen.getByText('💡 活动开始后，请用力摇动手机')).toBeInTheDocument();
    });

    it('should check sensor support on mount', () => {
      renderShakePage();

      expect(ShakeSensor).toHaveBeenCalled();
      expect(mockSensor.isSupported).toHaveBeenCalled();
    });
  });

  describe('Shaking State', () => {
    it('should render shaking state when status is shaking', async () => {
      const { container } = renderShakePage();

      // Trigger start shaking
      const methods = (window as any).__shakePageMethods;
      methods.startShaking();

      await waitFor(() => {
        expect(screen.getByText('开始摇一摇！')).toBeInTheDocument();
      });

      expect(screen.getByText('用力摇动手机，冲击前三名！')).toBeInTheDocument();
      expect(mockSensor.reset).toHaveBeenCalled();
      expect(mockSensor.start).toHaveBeenCalled();
    });

    it('should display shake count during shaking', async () => {
      renderShakePage();

      const methods = (window as any).__shakePageMethods;
      methods.startShaking();

      await waitFor(() => {
        expect(screen.getByText('开始摇一摇！')).toBeInTheDocument();
      });

      // Check that shake count is displayed (initially 0)
      const countElements = screen.getAllByText('次');
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should call onShakeCountUpdate when shake is detected', async () => {
      renderShakePage();

      const methods = (window as any).__shakePageMethods;
      methods.startShaking();

      // Simulate shake detection by calling the callback
      const startCallback = mockSensor.start.mock.calls[0][0];
      startCallback(5);

      await waitFor(() => {
        expect(mockOnShakeCountUpdate).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('Stopped State', () => {
    it('should render stopped state when status is stopped', async () => {
      renderShakePage();

      // Start shaking first
      const methods = (window as any).__shakePageMethods;
      methods.startShaking();

      await waitFor(() => {
        expect(screen.getByText('开始摇一摇！')).toBeInTheDocument();
      });

      // Stop shaking
      methods.stopShaking();

      await waitFor(() => {
        expect(screen.getByText('活动已结束')).toBeInTheDocument();
      });

      expect(screen.getByText('您的最终摇动次数')).toBeInTheDocument();
      expect(screen.getByText('正在计算结果，请稍候...')).toBeInTheDocument();
      expect(mockSensor.stop).toHaveBeenCalled();
    });
  });

  describe('Result State - Winner', () => {
    it('should render winner result when user wins first place', async () => {
      renderShakePage();

      const winners = [
        {
          rank: 1 as const,
          userId: mockUserId,
          nickname: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          shakeCount: 100,
        },
      ];

      const methods = (window as any).__shakePageMethods;
      
      await act(async () => {
        methods.handleLotteryResult(winners);
      });

      await waitFor(() => {
        expect(screen.getByText('恭喜中奖！')).toBeInTheDocument();
      });

      expect(screen.getByText('🥇 一等奖')).toBeInTheDocument();
    });

    it('should render winner result when user wins second place', async () => {
      renderShakePage();

      const winners = [
        {
          rank: 1 as const,
          userId: 'other-user',
          nickname: 'Other User',
          avatarUrl: 'https://example.com/avatar.jpg',
          shakeCount: 150,
        },
        {
          rank: 2 as const,
          userId: mockUserId,
          nickname: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          shakeCount: 100,
        },
      ];

      const methods = (window as any).__shakePageMethods;
      
      await act(async () => {
        methods.handleLotteryResult(winners);
      });

      await waitFor(() => {
        expect(screen.getByText('恭喜中奖！')).toBeInTheDocument();
      });

      expect(screen.getByText('🥈 二等奖')).toBeInTheDocument();
    });

    it('should render winner result when user wins third place', async () => {
      renderShakePage();

      const winners = [
        {
          rank: 1 as const,
          userId: 'user-1',
          nickname: 'User 1',
          avatarUrl: 'https://example.com/avatar1.jpg',
          shakeCount: 150,
        },
        {
          rank: 2 as const,
          userId: 'user-2',
          nickname: 'User 2',
          avatarUrl: 'https://example.com/avatar2.jpg',
          shakeCount: 120,
        },
        {
          rank: 3 as const,
          userId: mockUserId,
          nickname: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          shakeCount: 100,
        },
      ];

      const methods = (window as any).__shakePageMethods;
      
      await act(async () => {
        methods.handleLotteryResult(winners);
      });

      await waitFor(() => {
        expect(screen.getByText('恭喜中奖！')).toBeInTheDocument();
      });

      expect(screen.getByText('🥉 三等奖')).toBeInTheDocument();
    });
  });

  describe('Result State - No Win', () => {
    it('should render no win result when user does not win', async () => {
      renderShakePage();

      const winners = [
        {
          rank: 1 as const,
          userId: 'other-user-1',
          nickname: 'Other User 1',
          avatarUrl: 'https://example.com/avatar1.jpg',
          shakeCount: 150,
        },
        {
          rank: 2 as const,
          userId: 'other-user-2',
          nickname: 'Other User 2',
          avatarUrl: 'https://example.com/avatar2.jpg',
          shakeCount: 120,
        },
        {
          rank: 3 as const,
          userId: 'other-user-3',
          nickname: 'Other User 3',
          avatarUrl: 'https://example.com/avatar3.jpg',
          shakeCount: 100,
        },
      ];

      const methods = (window as any).__shakePageMethods;
      
      await act(async () => {
        methods.handleLotteryResult(winners);
      });

      await waitFor(() => {
        expect(screen.getByText('感谢参与')).toBeInTheDocument();
      });

      expect(screen.getByText('下次继续加油！')).toBeInTheDocument();
    });
  });

  describe('Unsupported Device', () => {
    it('should render unsupported state when sensor is not supported', () => {
      mockSensor.isSupported.mockReturnValue(false);

      renderShakePage();

      expect(screen.getByText('设备不支持')).toBeInTheDocument();
      expect(screen.getByText('您的设备不支持摇一摇功能')).toBeInTheDocument();
      expect(screen.getByText('请使用支持加速度传感器的设备参与活动')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should stop sensor on unmount', () => {
      const { unmount } = renderShakePage();

      unmount();

      expect(mockSensor.stop).toHaveBeenCalled();
    });

    it('should clean up window methods on unmount', () => {
      const { unmount } = renderShakePage();

      expect((window as any).__shakePageMethods).toBeDefined();

      unmount();

      expect((window as any).__shakePageMethods).toBeUndefined();
    });
  });
});
