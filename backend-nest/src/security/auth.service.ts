
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly enabled =
    (process.env.KEYCLOAK_ENABLED ?? 'false').toLowerCase() === 'true';

  // Заглушка валидации токена: при KEYCLOAK_ENABLED=false всегда true.
  async validate(token: string | undefined): Promise<boolean> {
    if (!this.enabled) return true;

    if (!token) return false;
    const value = token.startsWith('Bearer ')
      ? token.slice(7).trim()
      : token.trim();
    if (!value) return false;

    // Разрешаем dev‑токен из переменной окружения (опционально).
    if (value === (process.env.KEYCLOAK_DEV_TOKEN ?? 'dev-token')) {
      return true;
    }

    // Здесь должна быть реальная проверка через Keycloak Introspection.
    // Пока — предупреждение и запрет.
    this.logger.warn(
      'KEYCLOAK_ENABLED=true, но реальная валидация не реализована (заглушка).',
    );
    return false;
    }
}
