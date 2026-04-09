import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const API_URL = 'http://localhost:5001';

interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  token: string;
  is_oauth?: boolean;
  risk_level?: string;
  favorite_sector?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ status: string; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ status: string; message?: string }>;
  googleLogin: (credential: string) => Promise<{ status: string; message?: string; is_new_user?: boolean }>; // updated authcontext interface to account for google new users
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('stockiq_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('stockiq_user');
      }
    }
  }, []);

  function saveUser(data: AuthUser) {
    setUser(data);
    localStorage.setItem('stockiq_user', JSON.stringify(data));
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveUser({ user_id: data.user_id, username: data.username, email: data.email, token: data.token });
    }
    return data;
  }

  async function register(username: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveUser({ user_id: data.user_id, username: data.username, email: data.email, token: data.token });
    }
    return data;
  }

  async function googleLogin(credential: string) {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      saveUser({ user_id: data.user_id, username: data.username, email: data.email, token: data.token, is_oauth: true });
    }
    return data;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('stockiq_user');
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
