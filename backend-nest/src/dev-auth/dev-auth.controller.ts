// src/dev-auth/dev-auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

type LoginDto = { email: string; password: string };
type RefreshDto = { refreshToken: string };

// ============ РЕЖИМ РАБОТЫ ============
// Переключатель между упрощенным режимом и Keycloak
const SIMPLE_AUTH_MODE = process.env.SIMPLE_AUTH_MODE === 'true' || true; // ВРЕМЕННО включен упрощенный режим
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

function realmUrl(): string {
  const env = process.env.KEYCLOAK_URL || 'http://localhost:8080/realms/ssto';
  return env.endsWith('/') ? env.slice(0, -1) : env;
}

function tokenUrl() {
  return `${realmUrl()}/protocol/openid-connect/token`;
}

function endSessionUrl() {
  return `${realmUrl()}/protocol/openid-connect/logout`;
}

function getClientId(): string {
  return process.env.KEYCLOAK_CLIENT_ID || 'ssto-local-client';
}

function getClientSecret(): string | undefined {
  return process.env.KEYCLOAK_CLIENT_SECRET || undefined;
}

@Controller(['auth', 'api/auth'])
export class DevAuthController {
  
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    
    // ============ УПРОЩЕННЫЙ РЕЖИМ (БЕЗ KEYCLOAK) ============
    if (SIMPLE_AUTH_MODE) {
      console.log(`[SIMPLE AUTH] Login attempt for: ${email}`);
      
      // НЕ проверяем пароль - вход свободный!
      // Роль определяется по email
      
      let role = 'client'; // По умолчанию
      const emailLower = email.toLowerCase();
      
      // Определяем роль по email
      if (emailLower.includes('admin') || 
          emailLower === 'a@a.com' ||
          emailLower === 'admin@test.com') {
        role = 'admin';
      } else if (emailLower.includes('operator') || 
                 emailLower === 'o@o.com' ||
                 emailLower === 'operator@test.com' ||
                 emailLower === 'operator1@test.com' ||
                 emailLower === 'operator2@test.com' ||
                 emailLower.endsWith('@morflot.ru') ||
                 emailLower.endsWith('@rosmorport.ru')) {
        role = 'operator';
      } else if (emailLower.includes('client') ||
                 emailLower === 'c@c.com' ||
                 emailLower === 'client@test.com' ||
                 emailLower === 'client1@test.com') {
        role = 'client';
      }
      
      // Создаем простой JWT токен
      const payload = {
        sub: this.generateIdFromEmail(email).toString(),
        email: email,
        preferred_username: email,
        name: this.getNameFromEmail(email),
        role: role,
        // Добавляем realm_access для совместимости с frontend кодом
        realm_access: {
          roles: [role]
        },
        organization_name: this.getOrganizationFromEmail(email),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 дней
      };
      
      const token = jwt.sign(payload, JWT_SECRET);
      
      console.log(`[SIMPLE AUTH] User logged in: ${email} with role: ${role}`);
      
      return {
        // CamelCase формат для frontend
        accessToken: token,
        refreshToken: `refresh-${token}`,
        tokenType: 'Bearer',
        expiresIn: 604800, // 7 дней в секундах
        scope: 'openid profile email',
        idToken: token,
        // Snake_case дубли для совместимости
        access_token: token,
        refresh_token: `refresh-${token}`,
        token_type: 'Bearer',
        expires_in: 604800,
        id_token: token,
      };
    }
    
    // ============ ОБЫЧНЫЙ РЕЖИМ (KEYCLOAK) ============
    try {
      console.log(`[KEYCLOAK] Attempting login for: ${email}`);
      
      const form = new URLSearchParams();
      form.append('client_id', getClientId());
      form.append('grant_type', 'password');
      form.append('username', email);
      form.append('password', password);
      form.append('scope', 'openid profile email');
      
      const clientSecret = getClientSecret();
      if (clientSecret) {
        form.append('client_secret', clientSecret);
      }

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
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        id_token: data.id_token,
      };
    } catch (e: any) {
      console.error('Keycloak login error:', e.response?.data || e.message);
      
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
    // ============ УПРОЩЕННЫЙ РЕЖИМ ============
    if (SIMPLE_AUTH_MODE) {
      // В упрощенном режиме просто создаем новый токен
      const oldToken = body.refreshToken.replace('refresh-', '');
      
      try {
        const decoded = jwt.verify(oldToken, JWT_SECRET) as any;
        
        const newPayload = {
          ...decoded,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // Еще 7 дней
        };
        
        const newToken = jwt.sign(newPayload, JWT_SECRET);
        
        return {
          accessToken: newToken,
          refreshToken: `refresh-${newToken}`,
          tokenType: 'Bearer',
          expiresIn: 604800,
          access_token: newToken,
          refresh_token: `refresh-${newToken}`,
          token_type: 'Bearer',
          expires_in: 604800,
        };
      } catch (error) {
        throw new HttpException('Invalid refresh token', 401);
      }
    }
    
    // ============ ОБЫЧНЫЙ РЕЖИМ (KEYCLOAK) ============
    const form = new URLSearchParams();
    form.append('client_id', getClientId());
    form.append('grant_type', 'refresh_token');
    form.append('refresh_token', body.refreshToken);
    
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
    // ============ УПРОЩЕННЫЙ РЕЖИМ ============
    if (SIMPLE_AUTH_MODE) {
      // В упрощенном режиме просто возвращаем успех
      console.log('[SIMPLE AUTH] User logged out');
      return;
    }
    
    // ============ ОБЫЧНЫЙ РЕЖИМ (KEYCLOAK) ============
    const form = new URLSearchParams();
    form.append('client_id', getClientId());
    form.append('refresh_token', body.refreshToken || '');
    
    const clientSecret = getClientSecret();
    if (clientSecret) {
      form.append('client_secret', clientSecret);
    }
    
    try {
      await axios.post(endSessionUrl(), form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });
      return;
    } catch (e: any) {
      console.error('Logout error:', e.response?.data || e.message);
      return; // Все равно возвращаем успех
    }
  }
  
  // ============ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ УПРОЩЕННОГО РЕЖИМА ============
  
  private generateIdFromEmail(email: string): number {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000;
  }
  
  private getNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    const nameMap: Record<string, string> = {
      'admin': 'Администратор',
      'operator': 'Оператор ССТО',
      'operator1': 'Оператор 1',
      'operator2': 'Оператор 2', 
      'client': 'Клиент',
      'client1': 'Клиент 1',
      'o': 'Оператор',
      'c': 'Клиент',
      'a': 'Администратор'
    };
    
    return nameMap[localPart] || 
           localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[._-]/g, ' ');
  }
  
  private getOrganizationFromEmail(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return 'Unknown Organization';
    
    const orgMap: Record<string, string> = {
      'morflot.ru': 'ФГБУ "Морспасслужба"',
      'rosmorport.ru': 'ФГУП "Росморпорт"',
      'test.com': 'Тестовая организация',
      'a.com': 'Admin Organization',
      'o.com': 'Operator Organization',
      'c.com': 'Client Organization'
    };
    
    return orgMap[domain] || `${domain}`;
  }
}