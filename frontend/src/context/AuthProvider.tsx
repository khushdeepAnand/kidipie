import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { api, clearStoredTokens, getStoredTokens, setStoredTokens } from '../api/axios';

export type User = {
  id: string;
  email: string;
  username: string;
  image_url: string | null
};

export interface UserCredentials {
  email: string;
  password: string;
}

export type Tokens = {
  access_token: string;
  refresh_token: string;
  user_id: string;
};

export type AuthContextType = {
  user: User | null;
  token: Tokens | null;
  loading: boolean;
  setToken: (token: Tokens | null) => void;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setTokenState] = useState<Tokens | null>(() => getStoredTokens());

  const [loading, setLoading] = useState(true);

  const setToken = (tokens: Tokens | null) => {
    if (tokens) {
      setStoredTokens(tokens);
    } else {
      clearStoredTokens();
    }

    setTokenState(tokens);
  };

  useEffect(() => {
    const syncTokens = () => setTokenState(getStoredTokens());
    window.addEventListener('auth-tokens-changed', syncTokens);
    window.addEventListener('storage', syncTokens);
    return () => {
      window.removeEventListener('auth-tokens-changed', syncTokens);
      window.removeEventListener('storage', syncTokens);
    };
  }, []);

  const getUser = async () => {
    try {
      const response = await api.get("auth/user");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    const mountUser = async () => {
      if (token) {
        try {
          await getUser();
          console.log("getUser SUCCESS");
        } catch (error) {
          console.log("getUser FAILED:", error);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    mountUser();
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    loading,
    setToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
