
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'] as string | undefined;

    const enabled =
      (process.env.KEYCLOAK_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) return true;

    const ok = await this.auth.validate(header);
    if (!ok) throw new UnauthorizedException('Invalid or missing access token');
    return true;
  }
}
