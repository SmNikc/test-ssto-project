import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class AuthService {
  async validateUser(token: string): Promise<boolean> {
    // Пример обращения к Keycloak/SSO для валидации токена
    // const res = await axios.get(...);
    return true;
  }
}
