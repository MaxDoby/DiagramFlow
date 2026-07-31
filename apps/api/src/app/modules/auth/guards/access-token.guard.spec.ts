import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from './access-token.guard';
import type { AccessTokenPayload } from '../schemas/access-token-payload.schema';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  let jwtServiceMock: {
    verifyAsync: jest.Mock;
  };

  let requestMock: {
    headers: {
      authorization?: string;
    };
    user?: AccessTokenPayload;
  };

  let executionContextMock: ExecutionContext;

  beforeEach(() => {
    jwtServiceMock = {
      verifyAsync: jest.fn(),
    };

    requestMock = {
      headers: {},
    };

    executionContextMock = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(requestMock),
      }),
    } as unknown as ExecutionContext;

    guard = new AccessTokenGuard(jwtServiceMock as unknown as JwtService);
  });

  it('allows a request with a valid access token', async () => {
    const payload: AccessTokenPayload = {
      sub: '11111111-1111-4111-8111-111111111111',
      email: 'student@diagramflow.test',
      iat: 1_893_456_000,
      exp: 1_893_456_900,
    };

    requestMock.headers.authorization = 'Bearer signed-access-token';
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(executionContextMock)).resolves.toBe(true);

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'signed-access-token',
    );
    expect(requestMock.user).toEqual(payload);
  });

  it('rejects a request without an authorization header', async () => {
    await expect(
      guard.canActivate(executionContextMock),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    requestMock.headers.authorization = 'Bearer invalid-access-token';
    jwtServiceMock.verifyAsync.mockRejectedValue(
      new Error('Token verification failed'),
    );

    await expect(
      guard.canActivate(executionContextMock),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(requestMock.user).toBeUndefined();
  });

  it('rejects a token with an invalid payload', async () => {
    requestMock.headers.authorization = 'Bearer signed-access-token';

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'not-a-uuid',
      email: 'invalid-email',
      iat: 'not-a-number',
      exp: null,
    });

    await expect(
      guard.canActivate(executionContextMock),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(requestMock.user).toBeUndefined();
  });
});
