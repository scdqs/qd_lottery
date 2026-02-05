/**
 * 抽奖系统全局状态管理
 * 使用React Context API管理应用状态
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  Participant,
  Winner,
  LotteryStatus,
  SessionInfo,
} from '../types';

// 状态接口
export interface LotteryState {
  sessionInfo: SessionInfo | null;
  participants: Participant[];
  shakeData: Map<string, number>;
  lotteryStatus: LotteryStatus;
  countdown: number;
  winners: Winner[];
  error: string | null;
}

// 初始状态
const initialState: LotteryState = {
  sessionInfo: null,
  participants: [],
  shakeData: new Map(),
  lotteryStatus: 'idle',
  countdown: 0,
  winners: [],
  error: null,
};

// Action类型
export type LotteryAction =
  | { type: 'SET_SESSION_INFO'; payload: SessionInfo }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'UPDATE_SHAKE_DATA'; payload: { userId: string; shakeCount: number } }
  | { type: 'BATCH_SHAKE_DATA'; payload: Array<{ userId: string; shakeCount: number }> }
  | { type: 'SET_LOTTERY_STATUS'; payload: LotteryStatus }
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'DECREMENT_COUNTDOWN' }
  | { type: 'SET_WINNERS'; payload: Winner[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Reducer函数
function lotteryReducer(state: LotteryState, action: LotteryAction): LotteryState {
  switch (action.type) {
    case 'SET_SESSION_INFO':
      return {
        ...state,
        sessionInfo: action.payload,
        lotteryStatus: 'waiting',
      };

    case 'ADD_PARTICIPANT': {
      // 检查是否已存在该参与者（根据userId去重）
      const exists = state.participants.some(
        (p) => p.userId === action.payload.userId
      );
      if (exists) {
        return state;
      }
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    }

    case 'UPDATE_SHAKE_DATA': {
      const newShakeData = new Map(state.shakeData);
      newShakeData.set(action.payload.userId, action.payload.shakeCount);
      return {
        ...state,
        shakeData: newShakeData,
      };
    }

    case 'BATCH_SHAKE_DATA': {
      if (action.payload.length === 0) {
        return state;
      }
      const newShakeData = new Map(state.shakeData);
      for (const { userId, shakeCount } of action.payload) {
        newShakeData.set(userId, shakeCount);
      }
      return {
        ...state,
        shakeData: newShakeData,
      };
    }

    case 'SET_LOTTERY_STATUS':
      return {
        ...state,
        lotteryStatus: action.payload,
      };

    case 'SET_COUNTDOWN':
      return {
        ...state,
        countdown: action.payload,
      };

    case 'DECREMENT_COUNTDOWN':
      return {
        ...state,
        countdown: Math.max(0, state.countdown - 1),
      };

    case 'SET_WINNERS':
      return {
        ...state,
        winners: action.payload,
        lotteryStatus: 'finished',
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context类型
interface LotteryContextType {
  state: LotteryState;
  dispatch: React.Dispatch<LotteryAction>;
}

// 创建Context
const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

// Provider组件
interface LotteryProviderProps {
  children: ReactNode;
}

export function LotteryProvider({ children }: LotteryProviderProps) {
  const [state, dispatch] = useReducer(lotteryReducer, initialState);

  return (
    <LotteryContext.Provider value={{ state, dispatch }}>
      {children}
    </LotteryContext.Provider>
  );
}

// 自定义Hook
export function useLottery() {
  const context = useContext(LotteryContext);
  if (context === undefined) {
    throw new Error('useLottery must be used within a LotteryProvider');
  }
  return context;
}
