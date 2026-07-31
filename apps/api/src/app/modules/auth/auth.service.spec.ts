import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { ForbiddenException } from '@nestjs/common';
import { hash } from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  let prismaServiceMock: {
    user: {
      findUnique: jest.Mock;
    };
    refreshSession: {
      create: jest.Mock;
    };
  };

  let jwtServiceMock: {
    signAsync: jest.Mock;
  };

  let configServiceMock: {
    getOrThrow: jest.Mock;
  };

  let emailVerificationServiceMock: {
    issueVerificationCode: jest.Mock;
  };

  beforeEach(async () => {
    prismaServiceMock = {
      user: {
        findUnique: jest.fn(),
      },
      refreshSession: {
        create: jest.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
    };

    configServiceMock = {
      getOrThrow: jest.fn(),
    };

    emailVerificationServiceMock = {
      issueVerificationCode: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: EmailVerificationService,
          useValue: emailVerificationServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rejects login when the email is not confirmed', async () => {
    const password = 'StrongPassword123!';
    const passwordHash = await hash(password, 4);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'student@diagramflow.test',
      passwordHash,
      name: null,
      avatarUrl: null,
      emailConfirmedAt: null,
    });

    await expect(
      service.login({
        email: 'student@diagramflow.test',
        password,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    expect(prismaServiceMock.refreshSession.create).not.toHaveBeenCalled();
  });

  it('logs in a user with a confirmed email', async () => {
    const password = 'StrongPassword123!';
    const passwordHash = await hash(password, 4);
    const userId = '11111111-1111-4111-8111-111111111111';
    const accessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.dGVzdC1zaWduYXR1cmU';

    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'student@diagramflow.test',
      passwordHash,
      name: null,
      avatarUrl: null,
      emailConfirmedAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    jwtServiceMock.signAsync.mockResolvedValue(accessToken);
    prismaServiceMock.refreshSession.create.mockResolvedValue(undefined);

    configServiceMock.getOrThrow.mockImplementation((key: string) => {
      if (key === 'REFRESH_TOKEN_TTL_DAYS') {
        return 7;
      }

      if (key === 'JWT_ACCESS_TTL_SECONDS') {
        return 900;
      }

      throw new Error(`Unexpected configuration key: ${key}`);
    });

    const result = await service.login({
      email: 'student@diagramflow.test',
      password,
    });

    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: userId,
      email: 'student@diagramflow.test',
    });

    expect(prismaServiceMock.refreshSession.create).toHaveBeenCalledWith({
      data: {
        userId,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });

    expect(result.response).toEqual({
      accessToken,
      accessTokenExpiresInSeconds: 900,
      user: {
        id: userId,
        email: 'student@diagramflow.test',
        name: null,
        avatarUrl: null,
      },
    });
  });
});
