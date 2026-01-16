/**
 * ParticipantList组件单元测试
 * 
 * 测试需求: 3.1, 3.2
 */

import { render, screen } from '@testing-library/react';
import { ParticipantList } from './ParticipantList';
import { Participant } from '../types';

describe('ParticipantList', () => {
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

  test('renders empty state when no participants', () => {
    render(<ParticipantList participants={[]} />);
    
    expect(screen.getByText('参与者列表 (0)')).toBeInTheDocument();
    expect(screen.getByText('暂无参与者')).toBeInTheDocument();
    expect(screen.getByText('等待用户扫描二维码加入...')).toBeInTheDocument();
  });

  test('renders participant list with correct count', () => {
    render(<ParticipantList participants={mockParticipants} />);
    
    expect(screen.getByText('参与者列表 (3)')).toBeInTheDocument();
  });

  test('renders all participant nicknames', () => {
    render(<ParticipantList participants={mockParticipants} />);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
  });

  test('renders all participant avatars with correct alt text', () => {
    render(<ParticipantList participants={mockParticipants} />);
    
    const avatar1 = screen.getByAltText('张三的头像');
    const avatar2 = screen.getByAltText('李四的头像');
    const avatar3 = screen.getByAltText('王五的头像');
    
    expect(avatar1).toBeInTheDocument();
    expect(avatar1).toHaveAttribute('src', 'https://example.com/avatar1.jpg');
    expect(avatar2).toBeInTheDocument();
    expect(avatar2).toHaveAttribute('src', 'https://example.com/avatar2.jpg');
    expect(avatar3).toBeInTheDocument();
    expect(avatar3).toHaveAttribute('src', 'https://example.com/avatar3.jpg');
  });

  test('renders online status for all participants', () => {
    render(<ParticipantList participants={mockParticipants} />);
    
    const statusElements = screen.getAllByText('在线');
    expect(statusElements).toHaveLength(3);
  });

  test('renders with single participant', () => {
    const singleParticipant = [mockParticipants[0]];
    render(<ParticipantList participants={singleParticipant} />);
    
    expect(screen.getByText('参与者列表 (1)')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  test('each participant item has correct data-testid', () => {
    render(<ParticipantList participants={mockParticipants} />);
    
    expect(screen.getByTestId('participant-user1')).toBeInTheDocument();
    expect(screen.getByTestId('participant-user2')).toBeInTheDocument();
    expect(screen.getByTestId('participant-user3')).toBeInTheDocument();
  });

  test('handles participants with special characters in nickname', () => {
    const specialParticipants: Participant[] = [
      {
        userId: 'user1',
        nickname: '张三 (测试)',
        avatarUrl: 'https://example.com/avatar1.jpg',
        joinedAt: Date.now(),
        socketId: 'socket1',
      },
    ];
    
    render(<ParticipantList participants={specialParticipants} />);
    expect(screen.getByText('张三 (测试)')).toBeInTheDocument();
  });

  test('renders status indicator for each participant', () => {
    const { container } = render(<ParticipantList participants={mockParticipants} />);
    
    const statusIndicators = container.querySelectorAll('.status-indicator.active');
    expect(statusIndicators).toHaveLength(3);
  });
});
