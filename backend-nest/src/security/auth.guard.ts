import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;
    
    const ok = await this.auth.validate(authHeader);
    if (!ok) throw new UnauthorizedException('Unauthorized');
    
    // Добавляем данные пользователя в request для упрощенного режима
    if (authHeader && process.env.SIMPLE_AUTH_MODE === 'true') {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          req.user = decoded;
          req.userId = decoded.sub || decoded.id;
        }
      } catch (error) {
        console.log('Could not decode token for user data');
      }
    }
    
    return true;
  }
}