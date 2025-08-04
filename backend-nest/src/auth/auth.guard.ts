<<<<<<< HEAD
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return false;
    }

    try {
      const tokenData = await this.authService.validateToken(token);
      if (!tokenData.active) {
        return false;
      }

      const userInfo = await this.authService.getUserInfo(token);
      request.user = userInfo;
      return true;
    } catch (error) {
      return false;
    }
=======
CopyEdit
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
#     // Реализуйте свою логику проверки авторизации/токена
#     const req = context.switchToHttp().getRequest();
#     // например: return !!req.user;
    return true;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
