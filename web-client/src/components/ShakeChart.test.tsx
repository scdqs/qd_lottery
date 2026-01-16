/**
 * ShakeChart组件单元测试
 */

import { render, screen } from '@testing-library/react';
import { ShakeChart } from './ShakeChart';
import { Participant } from '../types';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Mocked Bar Chart</div>,
}));

describe('ShakeChart', () => {
  const mockParticipants: Participant[] = [
    {
      userId: 'user1',
      nickname: '张三',
      avatarUrl: 'https://example.com/avatar1.jpg',
      joinedAt: Date.now(),
      socketId: 'socket1',
    },
    {
      userId: 'user2',
      nickname: '李四',
      avatarUrl: 'https://example.com/avatar2.jpg',
      joinedAt: Date.now(),
      socketId: 'socket2',
    },
    {
      userId: 'user3',
      nickname: '王五',
      avatarUrl: 'https://example.com/avatar3.jpg',
      joinedAt: Date.now(),
      socketId: 'socket3',
    },
  ];

  it('should render empty state when no participants', () => {
    const shakeData = new Map<string, number>();
    render(<ShakeChart participants={[]} shakeData={shakeData} />);

    expect(screen.getByText('摇动数据')).toBeInTheDocument();
    expect(screen.getByText('暂无参与者数据')).toBeInTheDocument();
    expect(screen.getByText('等待参与者加入...')).toBeInTheDocument();
  });

  it('should render chart when participants exist', () => {
    const shakeData = new Map<string, number>([
      ['user1', 10],
      ['user2', 20],
      ['user3', 15],
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    expect(screen.getByText('摇动数据')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should display participant information sorted by shake count', () => {
    const shakeData = new Map<string, number>([
      ['user1', 10],
      ['user2', 30],
      ['user3', 20],
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    // 验证参与者信息显示
    expect(screen.getByText('李四')).toBeInTheDocument(); // 最高分
    expect(screen.getByText('王五')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();

    // 验证摇动次数显示
    expect(screen.getByText('30 次')).toBeInTheDocument();
    expect(screen.getByText('20 次')).toBeInTheDocument();
    expect(screen.getByText('10 次')).toBeInTheDocument();
  });

  it('should display rank badges for top 3', () => {
    const shakeData = new Map<string, number>([
      ['user1', 10],
      ['user2', 30],
      ['user3', 20],
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    // 验证前三名的徽章
    expect(screen.getByText('🥇')).toBeInTheDocument(); // 第一名
    expect(screen.getByText('🥈')).toBeInTheDocument(); // 第二名
    expect(screen.getByText('🥉')).toBeInTheDocument(); // 第三名
  });

  it('should handle participants with zero shake count', () => {
    const shakeData = new Map<string, number>([
      ['user1', 0],
      ['user2', 5],
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    expect(screen.getByText('5 次')).toBeInTheDocument();
    // Use getAllByText since there are multiple "0 次" elements
    const zeroCountElements = screen.getAllByText('0 次');
    expect(zeroCountElements.length).toBeGreaterThan(0);
  });

  it('should display avatars for participants', () => {
    const shakeData = new Map<string, number>([
      ['user1', 10],
      ['user2', 20],
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThan(0);
    expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar2.jpg');
  });

  it('should show "more participants" message when more than 10 participants', () => {
    const manyParticipants: Participant[] = Array.from({ length: 15 }, (_, i) => ({
      userId: `user${i}`,
      nickname: `用户${i}`,
      avatarUrl: `https://example.com/avatar${i}.jpg`,
      joinedAt: Date.now(),
      socketId: `socket${i}`,
    }));

    const shakeData = new Map<string, number>(
      manyParticipants.map((p, i) => [p.userId, i])
    );

    render(<ShakeChart participants={manyParticipants} shakeData={shakeData} />);

    expect(screen.getByText(/还有 5 位参与者.../)).toBeInTheDocument();
  });

  it('should handle missing shake data for participants', () => {
    const shakeData = new Map<string, number>([
      ['user1', 10],
      // user2 and user3 have no shake data
    ]);

    render(<ShakeChart participants={mockParticipants} shakeData={shakeData} />);

    // Should still render all participants with 0 for missing data
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
  });
});
