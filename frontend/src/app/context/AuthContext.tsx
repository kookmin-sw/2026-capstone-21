import { createContext, useContext, useState, ReactNode } from "react";
import { getFavorites } from "../../api/favorite";
import { loginApi, signupApi } from "../../api/auth";

type LoginResult = "success" | "account-not-found" | "wrong-password";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, userName: string) => Promise<void>;
  logout: () => void;
  favoritesLoaded: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("role") === "admin"
  );

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const data = await loginApi(email, password);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", String(data.user_info.user_id));
      localStorage.setItem("user_name", data.user_info.user_name);
      localStorage.setItem("role", data.user_info.role);

      setIsAuthenticated(true);
      setIsAdmin(data.user_info.role === "admin");

      // Chatwoot에 유저 식별 정보 전달 (HMAC으로 이전 대화 목록 활성화)
      if (window.$chatwoot) {
        const userId = String(data.user_info.user_id);
        try {
          const hmacRes = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/chatwoot/hmac/${data.user_info.user_id}`
          );
          const hmacData = await hmacRes.json();
          window.$chatwoot.setUser(userId, {
            name: data.user_info.user_name || `user_${userId}`,
            identifier_hash: hmacData.identifier_hash,
          });
        } catch {
          window.$chatwoot.setUser(userId, {
            name: data.user_info.user_name || `user_${userId}`,
          });
        }
      }

      return "success";
    } catch (error: any) {
      if (error.message === "wrong-password") {
        return "wrong-password";
      }

      return "account-not-found";
    }
  };

  const signup = async (
    email: string,
    password: string,
    userName: string
  ) => {
    await signupApi(email, password, userName);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("role");

    setIsAuthenticated(false);
    setIsAdmin(false);

    // Chatwoot 세션 리셋
    if (window.$chatwoot) {
      window.$chatwoot.reset();
    }
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

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}