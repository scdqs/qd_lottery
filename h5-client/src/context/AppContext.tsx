import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WeChatUserInfo, Winner, ShakeStatus, AuthStatus } from '../types';

/**
 * 应用状态接口
 */
interface AppState {
  // 会话信息
  sessionId: string | null;
  
  // 用户信息
  userInfo: WeChatUserInfo | null;
  authStatus: AuthStatus;
  
  // 摇动状态
  shakeStatus: ShakeStatus;
  shakeCount: number;
  
  // 中奖信息
  isWinner: boolean;
  rank: number | null;
  winners: Winner[];
  
  // 错误信息
  errorMessage: string | null;
}

/**
 * 应用上下文操作接口
 */
interface AppContextValue extends AppState {
  // 会话操作
  setSessionId: (sessionId: string) => void;
  
  // 用户操作
  setUserInfo: (userInfo: WeChatUserInfo) => void;
  setAuthStatus: (status: AuthStatus) => void;
  
  // 摇动操作
  setShakeStatus: (status: ShakeStatus) => void;
  setShakeCount: (count: number) => void;
  incrementShakeCount: () => void;
  
  // 中奖操作
  setWinners: (winners: Winner[]) => void;
  checkWinnerStatus: (userId: string, winners?: Winner[]) => void;
  
  // 错误操作
  setErrorMessage: (message: string | null) => void;
  
  // 重置操作
  resetState: () => void;
}

// 初始状态
const initialState: AppState = {
  sessionId: null,
  userInfo: null,
  authStatus: 'pending',
  shakeStatus: 'waiting',
  shakeCount: 0,
  isWinner: false,
  rank: null,
  winners: [],
  errorMessage: null,
};

// 创建上下文
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * 应用上下文提供者
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  // 会话操作
  const setSessionId = (sessionId: string) => {
    setState(prev => ({ ...prev, sessionId }));
  };

  // 用户操作
  const setUserInfo = (userInfo: WeChatUserInfo) => {
    setState(prev => ({ ...prev, userInfo, authStatus: 'success' }));
  };

  const setAuthStatus = (authStatus: AuthStatus) => {
    setState(prev => ({ ...prev, authStatus }));
  };

  // 摇动操作
  const setShakeStatus = (shakeStatus: ShakeStatus) => {
    setState(prev => ({ ...prev, shakeStatus }));
  };

  const setShakeCount = (shakeCount: number) => {
    setState(prev => ({ ...prev, shakeCount }));
  };

  const incrementShakeCount = () => {
    setState(prev => ({ ...prev, shakeCount: prev.shakeCount + 1 }));
  };

  // 中奖操作
  const setWinners = (winners: Winner[]) => {
    setState(prev => ({ ...prev, winners }));
  };

  const checkWinnerStatus = (userId: string, winners?: Winner[]) => {
    const winnersToCheck = winners || state.winners;
    const winner = winnersToCheck.find(w => w.userId === userId);
    if (winner) {
      setState(prev => ({ ...prev, isWinner: true, rank: winner.rank }));
    } else {
      setState(prev => ({ ...prev, isWinner: false, rank: null }));
    }
  };

  // 错误操作
  const setErrorMessage = (errorMessage: string | null) => {
    setState(prev => ({ ...prev, errorMessage }));
  };

  // 重置操作
  const resetState = () => {
    setState(initialState);
  };

  const value: AppContextValue = {
    ...state,
    setSessionId,
    setUserInfo,
    setAuthStatus,
    setShakeStatus,
    setShakeCount,
    incrementShakeCount,
    setWinners,
    checkWinnerStatus,
    setErrorMessage,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * 使用应用上下文的Hook
 */
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
