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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  checkAuth: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Берем базовый URL из переменных окружения
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Используем /api/auth/login
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Неверный логин или пароль');
      }
      
      const data = await response.json();
      
      // Сохраняем токены
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;
      
      sessionStorage.setItem('token', accessToken);
      if (refreshToken) {
        sessionStorage.setItem('refreshToken', refreshToken);
      }
      
      // Декодируем токен для получения информации о пользователе
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('Token payload:', payload); // Для отладки
          
          // Извлекаем роль из realm_access.roles
          let userRole: 'operator' | 'client' | 'admin' = 'client'; // по умолчанию
          
          if (payload.realm_access?.roles) {
            if (payload.realm_access.roles.includes('operator')) {
              userRole = 'operator';
            } else if (payload.realm_access.roles.includes('admin')) {
              userRole = 'admin';
            } else if (payload.realm_access.roles.includes('client')) {
              userRole = 'client';
            }
          }
          
          const userData: User = {
            id: 1,
            email: payload.email || payload.preferred_username || email,
            role: userRole,
            organization_name: payload.organization_name || '',
            full_name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || email
          };
          
          console.log('Setting user:', userData); // Для отладки
          setUser(userData);
          
          // Перенаправляем в зависимости от роли
          setTimeout(() => {
            window.location.href = `/${userRole}`;
          }, 100);
          
        } catch (e) {
          console.error('Failed to decode JWT:', e);
          // Если не можем декодировать, используем базовую информацию
          setUser({
            id: 1,
            email: email,
            role: 'operator',
            organization_name: '',
            full_name: email
          });
          window.location.href = '/operator';
        }
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
      // Декодируем JWT токен
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Проверяем, не истек ли токен
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Токен истек, пробуем обновить
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              const newToken = data.accessToken || data.access_token;
              sessionStorage.setItem('token', newToken);
              sessionStorage.setItem('refreshToken', data.refreshToken || data.refresh_token);
              
              // Рекурсивно вызываем checkAuth с новым токеном
              return checkAuth();
            }
          } catch (err) {
            console.error('Token refresh failed:', err);
          }
        }
        // Если не удалось обновить токен
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        setUser(null);
      } else {
        // Токен валиден, устанавливаем пользователя
        let userRole: 'operator' | 'client' | 'admin' = 'client';
        
        if (payload.realm_access?.roles) {
          if (payload.realm_access.roles.includes('operator')) {
            userRole = 'operator';
          } else if (payload.realm_access.roles.includes('admin')) {
            userRole = 'admin';
          } else if (payload.realm_access.roles.includes('client')) {
            userRole = 'client';
          }
        }
        
        setUser({
          id: 1,
          email: payload.email || payload.preferred_username || '',
          role: userRole,
          organization_name: payload.organization_name || '',
          full_name: payload.name || payload.given_name || ''
        });
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};