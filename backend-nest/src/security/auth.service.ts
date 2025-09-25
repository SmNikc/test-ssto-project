// backend-nest/src/security/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * AuthService с поддержкой двух режимов:
 * 1. SIMPLE_AUTH_MODE=true - упрощенный режим с JWT без Keycloak
 * 2. KEYCLOAK_ENABLED=true - полноценная работа с Keycloak
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SIMPLE_AUTH_MODE = process.env.SIMPLE_AUTH_MODE === 'true' || true;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
  
  async validate(authHeader?: string): Promise<boolean> {
    // ========= УПРОЩЕННЫЙ РЕЖИМ С JWT =========
    if (this.SIMPLE_AUTH_MODE) {
      if (!authHeader) {
        this.logger.warn('No auth header in simple mode');
        return false;
      }
      
      const [scheme, token] = authHeader.split(' ');
      if ((scheme || '').toLowerCase() !== 'bearer' || !token) {
        this.logger.warn('Invalid auth header format in simple mode');
        return false;
      }
      
      try {
        // Проверяем JWT токен
        jwt.verify(token, this.JWT_SECRET);
        this.logger.debug('Token validated successfully in simple mode');
        return true;
      } catch (error) {
        this.logger.warn('Invalid JWT token in simple mode:', error.message);
        return false;
      }
    }
    
    // ========= РЕЖИМ KEYCLOAK =========
    const enabled = (process.env.KEYCLOAK_ENABLED || 'false').toLowerCase() === 'true';
    
    // Если Keycloak отключен и не в simple mode - пропускаем всё
    if (!enabled) {
      this.logger.debug('Both SIMPLE_AUTH_MODE and KEYCLOAK_ENABLED are false - allowing all requests');
      return true;
    }

    // Keycloak режим
    if (!authHeader) return false;
    const [scheme, token] = authHeader.split(' ');
    if ((scheme || '').toLowerCase() !== 'bearer' || !token) return false;

    // TODO: Реальная проверка токена через Keycloak introspection endpoint
    this.logger.warn(
      'KEYCLOAK_ENABLED=true, но реальная валидация не реализована. ' +
      'Нужно добавить проверку через introspection endpoint Keycloak.'
    );
    return false;
  }
  
  /**
   * Извлекает данные пользователя из токена (для использования в контроллерах)
   */
  async getUserFromToken(authHeader?: string): Promise<any> {
    if (!authHeader) return null;
    
    const [scheme, token] = authHeader.split(' ');
    if ((scheme || '').toLowerCase() !== 'bearer' || !token) return null;
    
    try {
      const decoded = jwt.decode(token) as any;
      
      // Добавляем дополнительную обработку для упрощенного режима
      if (this.SIMPLE_AUTH_MODE && decoded) {
        // Убеждаемся, что есть роль
        if (!decoded.role && decoded.realm_access?.roles?.[0]) {
          decoded.role = decoded.realm_access.roles[0];
        }
        
        this.logger.debug(`User extracted from token: ${decoded.email} with role: ${decoded.role}`);
      }
      
      return decoded;
    } catch (error) {
      this.logger.error('Failed to decode token:', error);
      return null;
    }
  }
  
  /**
   * Проверяет, истек ли токен
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }
}