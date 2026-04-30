import { createContext, useContext, useState, ReactNode } from 'react';
import { getFavorites } from '../../api/favorite';

type LoginResult = 'success' | 'account-not-found' | 'wrong-password';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, userName: string) => Promise<void>;
  logout: () => void;
  favoritesLoaded: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token')
  );
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 404) return 'account-not-found';
      if (res.status === 401) return 'wrong-password';

      if (!res.ok) {
        return 'account-not-found';
      }

      const data = await res.json();

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', String(data.user_info.user_id));
      localStorage.setItem('user_name', data.user_info.user_name);

      setIsAuthenticated(true);
      setIsAdmin(data.user_info.role === 'admin');

      return 'success';
    } catch (error) {
      console.error('로그인 실패:', error);
      return 'account-not-found';
    }
  };

  const signup = async (
    email: string,
    password: string,
    userName: string
  ) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        user_name: userName,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');

    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const favoritesLoaded = async () => {
    return await getFavorites();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        login,
        signup,
        logout,
        favoritesLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}