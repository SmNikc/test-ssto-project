<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly keycloakUrl = process.env.KEYCLOAK_URL;
  private readonly realm = process.env.KEYCLOAK_REALM;
  private readonly clientId = process.env.KEYCLOAK_CLIENT_ID;
  private readonly clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  async validateToken(token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`,
        new URLSearchParams({
          token: token,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  async getUserInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user info');
    }
=======
CopyEdit
import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class AuthService {
  async validateUser(token: string): Promise<boolean> {
#     // Пример обращения к Keycloak/SSO для валидации токена
#     // const res = await axios.get(...);
    return true;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
