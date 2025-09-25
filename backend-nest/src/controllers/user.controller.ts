import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  Req, 
  UseGuards,
  UnauthorizedException,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

// DTO для типизации ответа
export interface UserProfileDto {
  id: number;
  email: string;
  role: 'operator' | 'client' | 'admin';
  organization_name: string;
  full_name: string;
}

// Интерфейс для payload токена
interface JwtPayload {
  sub?: string;
  id?: number;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles?: string[];
  };
  role?: string;
  organization_name?: string;
  exp?: number;
}

@Controller(['users', 'api/users'])
export class UserController {
  // ВРЕМЕННЫЙ ФЛАГ для упрощенного режима (можно вынести в .env)
  private readonly SIMPLE_AUTH_MODE = process.env.SIMPLE_AUTH_MODE === 'true' || true;

  constructor(private readonly service: UserService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll() {
    try {
      return await this.service.findAll();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request): Promise<UserProfileDto> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      const payload: JwtPayload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // УПРОЩЕННЫЙ РЕЖИМ: определяем роль по email
      if (this.SIMPLE_AUTH_MODE) {
        return this.getSimpleAuthProfile(payload);
      }

      // ОБЫЧНЫЙ РЕЖИМ: работа с Keycloak (код сохранен для будущего использования)
      return this.getKeycloakProfile(payload);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid or malformed token');
    }
  }

  /**
   * УПРОЩЕННЫЙ режим авторизации - роль определяется по email
   */
  private async getSimpleAuthProfile(payload: JwtPayload): Promise<UserProfileDto> {
    const email = payload.email || 
                  payload.preferred_username || 
                  'unknown@example.com';
    
    // Определяем роль по email/логину
    let userRole: 'operator' | 'client' | 'admin' = 'client';
    const emailLower = email.toLowerCase();
    
    // Правила определения роли по email
    if (emailLower.includes('admin') || 
        emailLower === 'admin@test.com' ||
        emailLower === 'a@a.com') {
      userRole = 'admin';
    } else if (emailLower.includes('operator') || 
               emailLower.startsWith('operator') ||
               emailLower === 'operator@test.com' ||
               emailLower === 'o@o.com' ||
               emailLower.includes('@morflot') || // Пример: сотрудники Морфлота - операторы
               emailLower.includes('@rosmorport')) {
      userRole = 'operator';
    } else if (emailLower.includes('client') ||
               emailLower === 'client@test.com' ||
               emailLower === 'c@c.com') {
      userRole = 'client';
    }
    // Все остальные по умолчанию - клиенты

    // Пытаемся найти пользователя в БД (если БД используется)
    try {
      const user = await this.service.findByEmail(email).catch(() => null);
      
      if (user) {
        const userAny = user as any;
        return {
          id: userAny.id || this.generateIdFromEmail(email),
          email: userAny.email || email,
          role: userRole, // Роль определена по email
          organization_name: userAny.organization_name || 
                            this.getOrganizationFromEmail(email),
          full_name: userAny.full_name || 
                    payload.name || 
                    this.getNameFromEmail(email)
        };
      }
    } catch (error) {
      console.log('DB not available in simple mode, using mock data');
    }

    // Возвращаем мок-данные если БД недоступна
    return {
      id: this.generateIdFromEmail(email),
      email: email,
      role: userRole,
      organization_name: this.getOrganizationFromEmail(email),
      full_name: payload.name || this.getNameFromEmail(email)
    };
  }

  /**
   * ОБЫЧНЫЙ режим с Keycloak (сохранен для будущего использования)
   */
  private async getKeycloakProfile(payload: JwtPayload): Promise<UserProfileDto> {
    // Проверяем срок действия токена
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    // Извлекаем роль из Keycloak структуры
    let userRole: 'operator' | 'client' | 'admin' = 'client';
    
    if (payload.realm_access?.roles && Array.isArray(payload.realm_access.roles)) {
      if (payload.realm_access.roles.includes('admin')) {
        userRole = 'admin';
      } else if (payload.realm_access.roles.includes('operator')) {
        userRole = 'operator';
      } else if (payload.realm_access.roles.includes('client')) {
        userRole = 'client';
      }
    }

    const email = payload.email || payload.preferred_username || 'unknown@example.com';

    // Пытаемся найти в БД
    try {
      const user = await this.service.findByEmail(email);
      if (user) {
        const userAny = user as any;
        return {
          id: userAny.id || parseInt(payload.sub || '0'),
          email: userAny.email || email,
          role: userRole,
          organization_name: userAny.organization_name || payload.organization_name || '',
          full_name: userAny.full_name || payload.name || email
        };
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    // Fallback на данные из токена
    return {
      id: parseInt(payload.sub || '0') || this.generateIdFromEmail(email),
      email: email,
      role: userRole,
      organization_name: payload.organization_name || '',
      full_name: payload.name || this.buildFullName(payload) || email
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // В упрощенном режиме можем возвращать мок-данные
    if (this.SIMPLE_AUTH_MODE) {
      // Возвращаем мок-пользователя
      return {
        id: id,
        email: `user${id}@test.com`,
        role: 'client',
        organization_name: 'Test Organization',
        full_name: `User ${id}`
      };
    }

    try {
      const user = await this.service.findOne(id);
      if (!user) {
        throw new HttpException(
          `User with ID ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching user:', error);
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // === Вспомогательные методы для упрощенного режима ===

  /**
   * Генерирует стабильный ID на основе email
   */
  private generateIdFromEmail(email: string): number {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000; // Ограничиваем до 6 цифр
  }

  /**
   * Определяет организацию по email домену
   */
  private getOrganizationFromEmail(email: string): string {
    const domain = email.split('@')[1];
    if (!domain) return 'Unknown Organization';

    const orgMap: Record<string, string> = {
      'morflot.ru': 'ФГБУ "Морспасслужба"',
      'rosmorport.ru': 'ФГУП "Росморпорт"',
      'test.com': 'Тестовая организация',
      'gmail.com': 'Частное лицо',
      'yandex.ru': 'Частное лицо',
      'mail.ru': 'Частное лицо'
    };

    return orgMap[domain] || `Организация (${domain})`;
  }

  /**
   * Генерирует имя из email
   */
  private getNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    
    // Специальные случаи
    const nameMap: Record<string, string> = {
      'admin': 'Администратор',
      'operator': 'Оператор ССТО',
      'operator1': 'Оператор 1',
      'operator2': 'Оператор 2',
      'client': 'Клиент',
      'client1': 'Клиент 1',
      'test': 'Тестовый пользователь'
    };

    if (nameMap[localPart]) {
      return nameMap[localPart];
    }

    // Пытаемся красиво преобразовать email в имя
    return localPart
      .replace(/[._-]/g, ' ')
      .replace(/\d+/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim() || 'Пользователь';
  }

  private buildFullName(payload: JwtPayload): string {
    const parts = [];
    if (payload.given_name) parts.push(payload.given_name);
    if (payload.family_name) parts.push(payload.family_name);
    return parts.join(' ').trim();
  }
}