import { createContext, useContext, useState, ReactNode } from 'react';

type LoginResult = 'success' | 'account-not-found' | 'wrong-password';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => LoginResult;
  signup: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'linkd_match_users';
const AUTH_STATE_KEY = 'linkd_match_auth_state';

// localStorage에서 사용자 데이터 불러오기 (Object 사용)
const loadUsersFromStorage = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load users from localStorage:', error);
  }
  // 기본 테스트 계정
  const defaultUsers = { 'test@test.com': 'Test1234!' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

// localStorage에 사용자 데이터 저장 (Object 사용)
const saveUsersToStorage = (users: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
  }
};

// localStorage에서 인증 상태 불러오기
const loadAuthState = (): { isAuthenticated: boolean; isAdmin: boolean } => {
  try {
    const stored = localStorage.getItem(AUTH_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load auth state from localStorage:', error);
  }
  return { isAuthenticated: false, isAdmin: false };
};

// localStorage에 인증 상태 저장
const saveAuthState = (isAuthenticated: boolean, isAdmin: boolean) => {
  try {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ isAuthenticated, isAdmin }));
  } catch (error) {
    console.error('Failed to save auth state to localStorage:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadAuthState().isAuthenticated);
  const [isAdmin, setIsAdmin] = useState(() => loadAuthState().isAdmin);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, string>>(() => loadUsersFromStorage());

  const login = (email: string, password: string): LoginResult => {
    // Check if admin account
    if (email === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      saveAuthState(true, true);
      return 'success';
    }

    // localStorage에서 직접 최신 유저 목록 가져오기
    const latestUsers = loadUsersFromStorage();

    // Mock login - check if user exists
    if (!latestUsers[email]) {
      return 'account-not-found';
    }

    // Check if password matches
    if (latestUsers[email] !== password) {
      return 'wrong-password';
    }

    // State도 동기화
    setRegisteredUsers(latestUsers);
    setIsAuthenticated(true);
    setIsAdmin(false);
    saveAuthState(true, false);
    return 'success';
  };

  const signup = (email: string, password: string) => {
    // localStorage에서 최신 유저 목록 가져오기
    const latestUsers = loadUsersFromStorage();

    // 새 유저 추가
    const updatedUsers = { ...latestUsers, [email]: password };

    // localStorage에 즉시 저장
    saveUsersToStorage(updatedUsers);

    // State 업데이트
    setRegisteredUsers(updatedUsers);
    setIsAuthenticated(true);
    setIsAdmin(false);
    saveAuthState(true, false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    saveAuthState(false, false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
