/**
 * WinnerDisplay组件单元测试
 */

import { render, screen } from '@testing-library/react';
import { WinnerDisplay } from './WinnerDisplay';
import { Winner } from '../types';

describe('WinnerDisplay', () => {
  const mockWinners: Winner[] = [
    {
      rank: 1,
      userId: 'user-1',
      nickname: '第一名用户',
      avatarUrl: 'https://example.com/avatar1.jpg',
      shakeCount: 100,
    },
    {
      rank: 2,
      userId: 'user-2',
      nickname: '第二名用户',
      avatarUrl: 'https://example.com/avatar2.jpg',
      shakeCount: 80,
    },
    {
      rank: 3,
      userId: 'user-3',
      nickname: '第三名用户',
      avatarUrl: 'https://example.com/avatar3.jpg',
      shakeCount: 60,
    },
  ];

  it('should render nothing when winners array is empty', () => {
    const { container } = render(<WinnerDisplay winners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render winner display with title', () => {
    render(<WinnerDisplay winners={mockWinners} />);
    expect(screen.getByText(/中奖名单/i)).toBeInTheDocument();
  });

  it('should render all winners with correct rank labels', () => {
    render(<WinnerDisplay winners={mockWinners} />);
    
    expect(screen.getByText('🥇 第一名')).toBeInTheDocument();
    expect(screen.getByText('🥈 第二名')).toBeInTheDocument();
    expect(screen.getByText('🥉 第三名')).toBeInTheDocument();
  });

  it('should render winner nicknames', () => {
    render(<WinnerDisplay winners={mockWinners} />);
    
    expect(screen.getByText('第一名用户')).toBeInTheDocument();
    expect(screen.getByText('第二名用户')).toBeInTheDocument();
    expect(screen.getByText('第三名用户')).toBeInTheDocument();
  });

  it('should render winner shake counts', () => {
    render(<WinnerDisplay winners={mockWinners} />);
    
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument();
  });

  it('should render winner avatars with correct src', () => {
    render(<WinnerDisplay winners={mockWinners} />);
    
    const avatars = screen.getAllByRole('img');
    expect(avatars).toHaveLength(3);
    expect(avatars[0]).toHaveAttribute('src', 'https://example.com/avatar1.jpg');
    expect(avatars[1]).toHaveAttribute('src', 'https://example.com/avatar2.jpg');
    expect(avatars[2]).toHaveAttribute('src', 'https://example.com/avatar3.jpg');
  });

  it('should apply correct CSS classes for different ranks', () => {
    const { container } = render(<WinnerDisplay winners={mockWinners} />);
    
    const winnerCards = container.querySelectorAll('.winner-card');
    expect(winnerCards).toHaveLength(3);
    expect(winnerCards[0]).toHaveClass('rank-1');
    expect(winnerCards[1]).toHaveClass('rank-2');
    expect(winnerCards[2]).toHaveClass('rank-3');
  });

  it('should render with less than 3 winners', () => {
    const twoWinners = mockWinners.slice(0, 2);
    render(<WinnerDisplay winners={twoWinners} />);
    
    expect(screen.getByText('🥇 第一名')).toBeInTheDocument();
    expect(screen.getByText('🥈 第二名')).toBeInTheDocument();
    expect(screen.queryByText('🥉 第三名')).not.toBeInTheDocument();
  });

  it('should render with only one winner', () => {
    const oneWinner = mockWinners.slice(0, 1);
    render(<WinnerDisplay winners={oneWinner} />);
    
    expect(screen.getByText('🥇 第一名')).toBeInTheDocument();
    expect(screen.queryByText('🥈 第二名')).not.toBeInTheDocument();
    expect(screen.queryByText('🥉 第三名')).not.toBeInTheDocument();
  });
});
