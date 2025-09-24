// src/dev-auth/dev-auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpException } from '@nestjs/common';
import axios from 'axios';

type LoginDto = { email: string; password: string };
type RefreshDto = { refreshToken: string };

function realmUrl(): string {
  // из .env: KEYCLOAK_URL = http://localhost:8080/realms/ssto
  const env = process.env.KEYCLOAK_URL || 'http://localhost:8080/realms/ssto';
  return env.endsWith('/') ? env.slice(0, -1) : env;
}

function tokenUrl() {
  return `${realmUrl()}/protocol/openid-connect/token`;
}

function endSessionUrl() {
  return `${realmUrl()}/protocol/openid-connect/logout`;
}

// Получаем client_id из переменной окружения
function getClientId(): string {
  return process.env.KEYCLOAK_CLIENT_ID || 'ssto-local-client';
}

// Получаем client_secret из переменной окружения (если есть)
function getClientSecret(): string | undefined {
  return process.env.KEYCLOAK_CLIENT_SECRET || undefined;
}

@Controller(['auth', 'api/auth']) // Покрываем оба пути: /auth/* и /api/auth/*
export class DevAuthController {
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    
    try {
      const form = new URLSearchParams();
      form.append('client_id', getClientId());
      form.append('grant_type', 'password');
      form.append('username', email);
      form.append('password', password);
      form.append('scope', 'openid profile email');
      
      // Добавляем client_secret только если он задан (для confidential clients)
      const clientSecret = getClientSecret();
      if (clientSecret) {
        form.append('client_secret', clientSecret);
      }

      const { data } = await axios.post(tokenUrl(), form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000, // 10 секунд таймаут
      });

      // Возвращаем токены в удобном формате
      return {
        // CamelCase формат для frontend
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
        idToken: data.id_token,
        // Также дублируем в snake_case для совместимости
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        id_token: data.id_token,
      };
    } catch (e: any) {
      console.error('Login error:', e.response?.data || e.message);
      
      // Более информативные сообщения об ошибках
      if (e.response?.status === 401) {
        throw new HttpException('Неверный логин или пароль', 401);
      }
      if (e.code === 'ECONNREFUSED') {
        throw new HttpException('Keycloak сервер недоступен. Убедитесь, что Keycloak запущен на порту 8080', 503);
      }
      
      const status = e.response?.status ?? 500;
      const payload = e.response?.data ?? { error: 'login_failed', message: e.message };
      throw new HttpException(payload, status);
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshDto) {
    const form = new URLSearchParams();
    form.append('client_id', getClientId());
    form.append('grant_type', 'refresh_token');
    form.append('refresh_token', body.refreshToken);
    
    // Добавляем client_secret если есть
    const clientSecret = getClientSecret();
    if (clientSecret) {
      form.append('client_secret', clientSecret);
    }

    try {
      const { data } = await axios.post(tokenUrl(), form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
        idToken: data.id_token,
        // Snake_case дубли
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        id_token: data.id_token,
      };
    } catch (e: any) {
      console.error('Refresh error:', e.response?.data || e.message);
      
      if (e.response?.status === 400) {
        throw new HttpException('Refresh токен истек или невалидный', 401);
      }
      
      const status = e.response?.status ?? 500;
      const payload = e.response?.data ?? { error: 'refresh_failed', message: e.message };
      throw new HttpException(payload, status);
    }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: RefreshDto) {
    // Для Keycloak 26 refresh_token обязателен при logout по end_session
    const form = new URLSearchParams();
    form.append('client_id', getClientId());
    form.append('refresh_token', body.refreshToken || '');
    
    // Добавляем client_secret если есть
    const clientSecret = getClientSecret();
    if (clientSecret) {
      form.append('client_secret', clientSecret);
    }
    
    try {
      await axios.post(endSessionUrl(), form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });
      return; // Возвращаем 204 No Content
    } catch (e: any) {
      // Logout не критичен, просто логируем ошибку
      console.error('Logout error:', e.response?.data || e.message);
      
      // Можем проигнорировать ошибку logout и все равно вернуть успех
      // так как на клиенте токены все равно будут удалены
      return;
    }
  }
}