import { createContext, useContext, useState, ReactNode } from 'react';
import { getFavorites } from '../../api/favorite';

type LoginResult = 'success' | 'account-not-found' | 'wrong-password';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => LoginResult;
  signup: (email: string, password: string) => void;
  logout: () => void;
  favoritesLoaded: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = (email: string, password: string): LoginResult => {
    if (email === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      return 'success';
    }

    setIsAuthenticated(true);
    setIsAdmin(false);

    return 'success';
  };

  const signup = (email: string, password: string) => {
    setIsAuthenticated(true);
    setIsAdmin(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  // ✔ 핵심: 로그인 후 favorite 동기화
  const favoritesLoaded = async () => {
    return await getFavorites();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      login,
      signup,
      logout,
      favoritesLoaded
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
