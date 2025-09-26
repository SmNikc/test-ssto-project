import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * ЕДИНЫЙ ПУТЬ ДЛЯ API:
 * - Всегда используем относительный префикс "/api" (без localhost/портов)
 * - В dev проксирует Vite (vite.config.ts), в Docker — Nginx (nginx.conf)
 */
const API_PREFIX = '/api';
const api = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  // если кто-то случайно передаст уже "/api/...", не удваиваем префикс
  return p.startsWith('/api') ? p : `${API_PREFIX}${p}`;
};

/** Безопасное декодирование JWT с поддержкой UTF‑8 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
};

type Role = 'operator' | 'client' | 'admin';

const getRoleFromPayload = (payload: any): Role => {
  if (payload?.realm_access?.roles) {
    if (payload.realm_access.roles.includes('admin')) return 'admin';
    if (payload.realm_access.roles.includes('operator')) return 'operator';
    if (payload.realm_access.roles.includes('client')) return 'client';
  }
  if (payload?.role && ['operator', 'client', 'admin'].includes(payload.role)) {
    return payload.role as Role;
  }
  return 'client';
};

const Auth: React.FC = () => {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ошибка авторизации');
      }

      const token        = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (!token) {
        throw new Error('Токен не получен от сервера');
      }

      // сохраняем токены, как в проекте
      sessionStorage.setItem('token', token);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);

      // расклеиваем роль
      const payload = decodeJWT(token);
      if (!payload) throw new Error('Ошибка декодирования токена');
      const role = getRoleFromPayload(payload);

      // редирект на раздел роли
      setTimeout(() => {
        window.location.href = `/${role}`;
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 8, p: 3, borderRadius: 2, boxShadow: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Вход в систему
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="username"
          required
        />

        <TextField
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="current-password"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            Войти
          </Button>
          {loading && <CircularProgress size={24} />}
        </Box>
      </form>
    </Box>
  );
};

export default Auth;
