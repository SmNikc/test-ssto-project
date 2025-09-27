import { Injectable } from '@nestjs/common';

/**
 * Упрощённый AuthService.
 * Для локальной разработки KEYCLOAK_ENABLED=false => всегда пропускаем.
 * При включении Keycloak здесь можно реализовать реальную проверку токена (интроспекция).
 */
@Injectable()
export class AuthService {
  async validate(authHeader?: string): Promise<boolean> {
    const enabled = (process.env.KEYCLOAK_ENABLED || 'false').toLowerCase() === 'true';
    if (!enabled) return true; // локально всё разрешаем

    if (!authHeader) return false;
    const [scheme, token] = authHeader.split(' ');
    if ((scheme || '').toLowerCase() !== 'bearer' || !token) return false;

    // TODO: Реальная проверка токена, например через introspection endpoint.
    // Пока возвращаем false, чтобы явно напоминать включить реализацию при KEYCLOAK_ENABLED=true.
    return false;
  }
}
