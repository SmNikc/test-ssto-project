import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AuthService {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({ timeout: 5000 });
  }

  async validate(token?: string): Promise<boolean> {
    const enabled = (process.env.KEYCLOAK_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) return true;

    if (!token) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const url =
      process.env.KEYCLOAK_INTROSPECT_URL ||
      'http://localhost:8080/realms/master/protocol/openid-connect/token/introspect';
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'ssto-local';
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'ssto-secret';

    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('token', token.replace(/^Bearer\s+/i, ''));

      const { data } = await this.http.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!data?.active) throw new UnauthorizedException('Invalid token');
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token or Keycloak unavailable');
    }
  }
}
