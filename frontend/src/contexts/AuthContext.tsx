// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const API_BASE_URL = 'http://localhost:3001';

// Функция для безопасного декодирования JWT с поддержкой UTF-8
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка авторизации');
      }
      
      // Сохраняем токены
      if (data.accessToken || data.access_token) {
        const token = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;
        
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('refreshToken', refreshToken);
        
        // Декодируем токен с поддержкой UTF-8
        const payload = decodeJWT(token);
        
        if (!payload) {
          throw new Error('Ошибка декодирования токена');
        }
        
        console.log('Token payload:', payload);
        
        // Извлекаем роль
        let userRole: 'operator' | 'client' | 'admin' = 'client';
        
        if (payload.realm_access?.roles) {
          if (payload.realm_access.roles.includes('admin')) {
            userRole = 'admin';
          } else if (payload.realm_access.roles.includes('operator')) {
            userRole = 'operator';
          } else if (payload.realm_access.roles.includes('client')) {
            userRole = 'client';
          }
        } else if (payload.role) {
          userRole = payload.role;
        }
        
        const userData: User = {
          id: payload.sub ? parseInt(payload.sub) : 1,
          email: payload.email || email,
          role: userRole,
          organization_name: payload.organization_name || '',
          full_name: payload.name || email
        };
        
        setUser(userData);
        
        // Перенаправляем
        setTimeout(() => {
          window.location.href = `/${userRole}`;
        }, 100);
      } else {
        throw new Error('Токен не получен от сервера');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
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

  const checkAuth = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      // Декодируем JWT токен с поддержкой UTF-8
      const payload = decodeJWT(token);
      
      if (!payload) {
        throw new Error('Невалидный токен');
      }
      
      // Проверяем срок действия токена
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        await refreshToken();
        return;
      }
      
      // Извлекаем роль
      let userRole: 'operator' | 'client' | 'admin' = 'client';
      
      if (payload.realm_access?.roles) {
        if (payload.realm_access.roles.includes('admin')) {
          userRole = 'admin';
        } else if (payload.realm_access.roles.includes('operator')) {
          userRole = 'operator';
        } else if (payload.realm_access.roles.includes('client')) {
          userRole = 'client';
        }
      } else if (payload.role) {
        userRole = payload.role;
      }
      
      const userData: User = {
        id: payload.sub ? parseInt(payload.sub) : 1,
        email: payload.email || payload.preferred_username || '',
        role: userRole,
        organization_name: payload.organization_name || '',
        full_name: payload.name || ''
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

  const refreshToken = async () => {
    const refreshTokenValue = sessionStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      const newToken = data.accessToken || data.access_token;
      const newRefreshToken = data.refreshToken || data.refresh_token;
      
      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('refreshToken', newRefreshToken);
      
      await checkAuth();
    } catch (err) {
      console.error('Token refresh error:', err);
      await logout();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};