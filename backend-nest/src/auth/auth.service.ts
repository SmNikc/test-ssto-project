import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class AuthService {
  async validateUser(token: string): Promise<boolean> {
    if (!token) throw new UnauthorizedException('No token provided');
    try {
      // Пример валидации токена через Keycloak REST API
      const response = await axios.get('https://keycloak-server/auth/realms/yourrealm/protocol/openid-connect/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return !!response.data && !!response.data.sub;
    } catch (error) {
      // Ошибка валидации или Keycloak недоступен
      throw new UnauthorizedException('Invalid token or Keycloak unavailable');
    }
  }
}
