import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../api/axios';

export type User = {
  id: string;
  email: string;
  name?: string;
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

  const [token, setTokenState] = useState<Tokens | null>(() => {
    const stored = localStorage.getItem('tokens');

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('tokens');
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const setToken = (tokens: Tokens | null) => {
    if (tokens) {
      localStorage.setItem('tokens', JSON.stringify(tokens));
    } else {
      localStorage.removeItem('tokens');
    }

    setTokenState(tokens);
  };

const getUser = async () => {
  try {
    console.log("calling /auth/user");

    const response = await api.get("auth/user");

    console.log("user response:", response.data);

    setUser(response.data);
  } catch (error) {
    console.log("USER REQUEST ERROR:", error);
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
      console.log("NO TOKEN");
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