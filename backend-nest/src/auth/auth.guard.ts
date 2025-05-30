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
  }
}
