import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { AuthGuard } from '../security/auth.guard';

@Controller(['users', 'api/users']) // Поддерживаем оба пути
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('profile')
  @UseGuards(AuthGuard) // Защищаем endpoint авторизацией
  async getProfile(@Req() req: Request) {
    // Получаем токен из заголовка
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return { error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Декодируем JWT токен
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      // Ищем пользователя в БД по email из токена
      const user = await this.service.findByEmail(payload.email || payload.preferred_username);
      
      if (user) {
        // Используем type assertion чтобы обойти проверку TypeScript
        const userAny = user as any;
        return {
          id: userAny.id,
          email: userAny.email,
          role: userAny.role,
          organization_name: userAny.organization_name || '',
          full_name: userAny.full_name || ''
        };
      }
      
      // Если пользователя нет в БД, возвращаем данные из токена
      return {
        id: payload.sub || payload.id || 1,
        email: payload.email || payload.preferred_username,
        role: payload.role || payload.realm_access?.roles?.[0] || 'operator',
        organization_name: payload.organization_name || '',
        full_name: payload.name || payload.given_name || payload.email
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { error: 'Invalid token' };
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}