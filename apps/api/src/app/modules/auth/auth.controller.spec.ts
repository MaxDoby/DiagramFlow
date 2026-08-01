import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EmailVerificationService } from './email-verification.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: {
    refresh: jest.Mock;
  };
  let emailVerificationServiceMock: {
    confirmEmail: jest.Mock;
    resendVerificationCode: jest.Mock;
  };
  let configServiceMock: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    authServiceMock = {
      refresh: jest.fn(),
    };
    emailVerificationServiceMock = {
      confirmEmail: jest.fn(),
      resendVerificationCode: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: EmailVerificationService,
          useValue: emailVerificationServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('rejects refresh when cookie is missing', async () => {
    const request = {
      cookies: {},
    } as Request;

    const response = {} as Response;

    await expect(controller.refresh(request, response)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it('rotates the refresh cookie and returns a new access token', async () => {
    const currentRefreshToken = 'current-refresh-token';
    const newRefreshToken = 'new-refresh-token';
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const serviceResult = {
      response: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQifQ.dGVzdC1zaWduYXR1cmU',
        accessTokenExpiresInSeconds: 900,
      },
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: expiresAt,
    };

    authServiceMock.refresh.mockResolvedValue(serviceResult);
    configServiceMock.get.mockReturnValue('test');

    const request = {
      cookies: {
        diagramflow_refresh_token: currentRefreshToken,
      },
    } as Request;

    const cookieMock = jest.fn();
    const response = {
      cookie: cookieMock,
    } as unknown as Response;

    const result = await controller.refresh(request, response);

    expect(authServiceMock.refresh).toHaveBeenCalledWith(currentRefreshToken);
    expect(cookieMock).toHaveBeenCalledWith(
      'diagramflow_refresh_token',
      newRefreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: expiresAt,
        path: '/api/auth',
      },
    );
    expect(result).toEqual(serviceResult.response);
  });

  it('delegates email confirmation to the verification service', async () => {
    emailVerificationServiceMock.confirmEmail.mockResolvedValue(undefined);

    await expect(
      controller.confirmEmail({
        email: 'student@diagramflow.test',
        code: '123456',
      }),
    ).resolves.toBeUndefined();

    expect(emailVerificationServiceMock.confirmEmail).toHaveBeenCalledWith(
      'student@diagramflow.test',
      '123456',
    );
  });

  it('delegates resend verification to the verification service', async () => {
    emailVerificationServiceMock.resendVerificationCode.mockResolvedValue(
      undefined,
    );

    await expect(
      controller.resendVerification({
        email: 'student@diagramflow.test',
      }),
    ).resolves.toBeUndefined();

    expect(
      emailVerificationServiceMock.resendVerificationCode,
    ).toHaveBeenCalledWith('student@diagramflow.test');
  });
});
