import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ЕДИНЫЙ ПУТЬ ДЛЯ API:
 * - Всегда ходим на относительный префикс "/api" (без localhost/портов)
 * - В dev проксирует Vite (vite.config.ts), в Docker — Nginx (nginx.conf)
 */
const API_PREFIX = '/api';
const api = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith('/api') ? p : `${API_PREFIX}${p}`;
};

interface User {
  id: number;
  email: string;
  role: 'operator' | 'client' | 'admin';
  organization_name: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Декод JWT с поддержкой UTF‑8 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState<boolean>(true);
  const [error, setError]       = useState<string | null>(null);

  /** ЛОГИН: POST /api/auth/login → сохранить токены → роль → редирект /{role} */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Ошибка авторизации');
      }

      const token        = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;
      if (!token) throw new Error('Токен не получен от сервера');

      sessionStorage.setItem('token', token);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);

      const payload = decodeJWT(token);
      if (!payload) throw new Error('Ошибка декодирования токена');

      let userRole: 'operator' | 'client' | 'admin' = 'client';
      if (payload.realm_access?.roles) {
        if (payload.realm_access.roles.includes('admin')) userRole = 'admin';
        else if (payload.realm_access.roles.includes('operator')) userRole = 'operator';
        else if (payload.realm_access.roles.includes('client')) userRole = 'client';
      } else if (payload.role && ['operator', 'client', 'admin'].includes(payload.role)) {
        userRole = payload.role;
      }

      const userData: User = {
        id: payload.sub ? parseInt(String(payload.sub), 10) || 1 : 1,
        email: payload.email || payload.preferred_username || email,
        role: userRole,
        organization_name: payload.organization_name || '',
        full_name: payload.name || payload.full_name || email,
      };

      setUser(userData);

      setTimeout(() => {
        window.location.href = `/${userRole}`;
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Ошибка авторизации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /** ЛОГАУТ: POST /api/auth/logout → чистка → /login */
  const logout = async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await fetch(api('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  /** ПРОВЕРКА СЕССИИ: валидность JWT (exp), при необходимости — refresh */
  const checkAuth = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload) throw new Error('Невалидный токен');

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        await refreshToken();
        return;
      }

      let userRole: 'operator' | 'client' | 'admin' = 'client';
      if (payload.realm_access?.roles) {
        if (payload.realm_access.roles.includes('admin')) userRole = 'admin';
        else if (payload.realm_access.roles.includes('operator')) userRole = 'operator';
        else if (payload.realm_access.roles.includes('client')) userRole = 'client';
      } else if (payload.role && ['operator', 'client', 'admin'].includes(payload.role)) {
        userRole = payload.role;
      }

      const userData: User = {
        id: payload.sub ? parseInt(String(payload.sub), 10) || 1 : 1,
        email: payload.email || payload.preferred_username || '',
        role: userRole,
        organization_name: payload.organization_name || '',
        full_name: payload.name || '',
      };

      setUser(userData);
    } catch (err) {
      console.error('Auth check error:', err);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  /** REFRESH: POST /api/auth/refresh → новая пара токенов → checkAuth() */
  const refreshToken = async () => {
    const refreshTokenValue = sessionStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      await logout();
      return;
    }

    try {
      const response = await fetch(api('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newToken        = data.accessToken || data.access_token;
      const newRefreshToken = data.refreshToken || data.refresh_token;

      if (!newToken) throw new Error('No access token on refresh');

      sessionStorage.setItem('token', newToken);
      if (newRefreshToken) sessionStorage.setItem('refreshToken', newRefreshToken);

      await checkAuth();
    } catch (err) {
      console.error('Token refresh error:', err);
      await logout();
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};