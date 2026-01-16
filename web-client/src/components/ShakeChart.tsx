/**
 * 实时数据图表组件
 * 实时显示参与者摇动数据的柱状图
 */

import { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Participant } from '../types';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ShakeChartProps {
  participants: Participant[];
  shakeData: Map<string, number>;
}

interface ParticipantWithShake extends Participant {
  shakeCount: number;
}

export function ShakeChart({ participants, shakeData }: ShakeChartProps) {
  // 合并参与者数据和摇动数据，并按摇动次数排序
  const sortedData = useMemo(() => {
    const participantsWithShake: ParticipantWithShake[] = participants.map(p => ({
      ...p,
      shakeCount: shakeData.get(p.userId) || 0,
    }));

    // 按摇动次数从高到低排序
    return participantsWithShake.sort((a, b) => b.shakeCount - a.shakeCount);
  }, [participants, shakeData]);

  // 准备图表数据
  const chartData = useMemo(() => {
    const labels = sortedData.map(p => p.nickname);
    const data = sortedData.map(p => p.shakeCount);
    
    // 为前三名设置不同的颜色
    const backgroundColors = sortedData.map((_, index) => {
      if (index === 0) return 'rgba(255, 193, 7, 0.8)'; // 金色 - 第一名
      if (index === 1) return 'rgba(158, 158, 158, 0.8)'; // 银色 - 第二名
      if (index === 2) return 'rgba(205, 127, 50, 0.8)'; // 铜色 - 第三名
      return 'rgba(24, 144, 255, 0.6)'; // 蓝色 - 其他
    });

    const borderColors = sortedData.map((_, index) => {
      if (index === 0) return 'rgba(255, 193, 7, 1)';
      if (index === 1) return 'rgba(158, 158, 158, 1)';
      if (index === 2) return 'rgba(205, 127, 50, 1)';
      return 'rgba(24, 144, 255, 1)';
    });

    return {
      labels,
      datasets: [
        {
          label: '摇动次数',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    };
  }, [sortedData]);

  // 图表配置
  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 200, // 快速动画以实现实时更新效果
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const participant = sortedData[context.dataIndex];
            return [
              `摇动次数: ${context.parsed.y}`,
              `用户: ${participant.nickname}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: '摇动次数',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }), [sortedData]);

  // 当数据更新时，触发图表更新
  useEffect(() => {
    // Chart.js will automatically update when data changes
  }, [chartData]);

  // 如果没有参与者，显示空状态
  if (participants.length === 0) {
    return (
      <div className="shake-chart">
        <h2>摇动数据</h2>
        <div className="chart-empty">
          <p>暂无参与者数据</p>
          <p className="hint">等待参与者加入...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shake-chart">
      <h2>摇动数据</h2>
      <div className="chart-container" style={{ height: '400px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* 显示参与者详细信息 */}
      <div className="chart-participants-info">
        {sortedData.slice(0, 10).map((participant, index) => (
          <div 
            key={participant.userId} 
            className={`chart-participant-item ${index < 3 ? `rank-${index + 1}` : ''}`}
          >
            <div className="rank-badge">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${index + 1}`}
            </div>
            <img 
              src={participant.avatarUrl} 
              alt={participant.nickname}
              className="participant-avatar-small"
            />
            <div className="participant-info-inline">
              <span className="nickname">{participant.nickname}</span>
              <span className="shake-count">{participant.shakeCount} 次</span>
            </div>
          </div>
        ))}
        {sortedData.length > 10 && (
          <div className="more-participants">
            还有 {sortedData.length - 10} 位参与者...
          </div>
        )}
      </div>
    </div>
  );
}
