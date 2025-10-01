import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { AuthGuard } from '../../src/security/auth.guard';

const createContext = (authorization?: string): ExecutionContext => {
  const request = {
    headers: authorization ? { authorization } : {},
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
};

describe('AuthGuard', () => {
  it('throws Unauthorized when auth service rejects token', async () => {
    const authService = { validate: jest.fn().mockResolvedValue(false) } as any;
    const guard = new AuthGuard(authService);

    await expect(guard.canActivate(createContext('Bearer invalid'))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches decoded user when SIMPLE_AUTH_MODE=true', async () => {
    const authService = { validate: jest.fn().mockResolvedValue(true) } as any;
    const guard = new AuthGuard(authService);
    process.env.SIMPLE_AUTH_MODE = 'true';

    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const tokenPayload = Buffer.from(JSON.stringify({ sub: '1', role: 'operator' })).toString('base64url');
    const context = createContext(`Bearer ${header}.${tokenPayload}.signature`);
    const req = context.switchToHttp().getRequest();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.user).toMatchObject({ sub: '1', role: 'operator' });
  });
});
