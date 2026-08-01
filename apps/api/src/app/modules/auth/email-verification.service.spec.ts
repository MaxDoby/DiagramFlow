import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';

describe(`EmailVerificationService`, () => {
  let service: EmailVerificationService;
  let redisServiceMock: {
    setIfAbsentWithExpiration: jest.Mock;
    setWithExpiration: jest.Mock;
    getValue: jest.Mock;
    getTimeToLive: jest.Mock;
    deleteKey: jest.Mock;
  };

  let prismaServiceMock: {
    user: {
      updateMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  let mailServiceMock: {
    send: jest.Mock;
  };

  let configServiceMock: {
    getOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    redisServiceMock = {
      setIfAbsentWithExpiration: jest.fn(),
      setWithExpiration: jest.fn(),
      getValue: jest.fn(),
      getTimeToLive: jest.fn(),
      deleteKey: jest.fn(),
    };

    prismaServiceMock = {
      user: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mailServiceMock = {
      send: jest.fn(),
    };

    configServiceMock = {
      getOrThrow: jest.fn(),
    };

    redisServiceMock.setIfAbsentWithExpiration.mockResolvedValue(true);
    redisServiceMock.setWithExpiration.mockResolvedValue(undefined);
    redisServiceMock.getTimeToLive.mockResolvedValue(500);
    redisServiceMock.deleteKey.mockResolvedValue(undefined);
    prismaServiceMock.user.updateMany.mockResolvedValue({ count: 1 });
    mailServiceMock.send.mockResolvedValue(undefined);
    prismaServiceMock.user.findUnique.mockResolvedValue({
      emailConfirmedAt: null,
    });

    const configValues: Record<string, string | number> = {
      EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: 60,
      EMAIL_VERIFICATION_OTP_SECRET:
        'test-email-verification-secret-with-at-least-43-characters',
      EMAIL_VERIFICATION_OTP_TTL_SECONDS: 600,
      EMAIL_VERIFICATION_MAX_ATTEMPTS: 5,
    };

    configServiceMock.getOrThrow.mockImplementation((key: string) => {
      const value = configValues[key];

      if (value === undefined) {
        throw new Error(`Unexpected configuration key: ${key}`);
      }

      return value;
    });

    const module = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: RedisService, useValue: redisServiceMock },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
  });

  it('issues a six-digit code and stores it for the normalized email', async () => {
    const code = await service.issueVerificationCode(
      ' STUDENT@DIAGRAMFLOW.TEST ',
    );

    expect(code).toMatch(/^\d{6}$/);

    expect(redisServiceMock.setIfAbsentWithExpiration).toHaveBeenCalledWith(
      'email-verification:cooldown:student@diagramflow.test',
      '1',
      60,
    );

    expect(redisServiceMock.setWithExpiration).toHaveBeenCalledWith(
      'email-verification:otp:student@diagramflow.test',
      expect.any(String),
      600,
    );

    const storedValue = redisServiceMock.setWithExpiration.mock
      .calls[0][1] as string;

    const storedRecord = JSON.parse(storedValue) as {
      codeHash: string;
      attemptsRemaining: number;
    };

    expect(storedRecord.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedRecord.codeHash).not.toBe(code);
    expect(storedRecord.attemptsRemaining).toBe(5);
    expect(mailServiceMock.send).toHaveBeenCalledWith({
      to: 'student@diagramflow.test',
      subject: 'Confirm your DiagramFlow email',
      text: expect.stringContaining(code),
    });
  });

  it('rejects issuing another code while cooldown is active', async () => {
    redisServiceMock.setIfAbsentWithExpiration.mockResolvedValue(false);

    await expect(
      service.issueVerificationCode('student@diagramflow.test'),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });

    expect(redisServiceMock.setWithExpiration).not.toHaveBeenCalled();
  });

  it('confirms the email when the verification code is valid', async () => {
    const code = await service.issueVerificationCode(
      'student@diagramflow.test',
    );

    const storedValue = redisServiceMock.setWithExpiration.mock
      .calls[0][1] as string;

    redisServiceMock.getValue.mockResolvedValue(storedValue);

    await expect(
      service.confirmEmail('student@diagramflow.test', code),
    ).resolves.toBeUndefined();

    expect(prismaServiceMock.user.updateMany).toHaveBeenCalledWith({
      where: {
        email: 'student@diagramflow.test',
        emailConfirmedAt: null,
      },
      data: {
        emailConfirmedAt: expect.any(Date),
      },
    });

    expect(redisServiceMock.deleteKey).toHaveBeenCalledWith(
      'email-verification:otp:student@diagramflow.test',
    );
  });

  it('reduces the remaining attempts when the code is invalid', async () => {
    const code = await service.issueVerificationCode(
      'student@diagramflow.test',
    );

    const storedValue = redisServiceMock.setWithExpiration.mock
      .calls[0][1] as string;

    redisServiceMock.getValue.mockResolvedValue(storedValue);

    const wrongCode = code === '000000' ? '000001' : '000000';

    await expect(
      service.confirmEmail('student@diagramflow.test', wrongCode),
    ).rejects.toBeInstanceOf(BadRequestException);

    const updatedValue = redisServiceMock.setWithExpiration.mock
      .calls[1][1] as string;

    const updatedRecord = JSON.parse(updatedValue) as {
      codeHash: string;
      attemptsRemaining: number;
    };

    expect(updatedRecord.attemptsRemaining).toBe(4);
    expect(prismaServiceMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an expired verification code', async () => {
    redisServiceMock.getValue.mockResolvedValue(null);

    await expect(
      service.confirmEmail('student@diagramflow.test', '123456'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaServiceMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('resends a verification code for an unconfirmed user', async () => {
    await expect(
      service.resendVerificationCode(' STUDENT@DIAGRAMFLOW.TEST '),
    ).resolves.toBeUndefined();

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'student@diagramflow.test',
      },
      select: {
        emailConfirmedAt: true,
      },
    });

    expect(mailServiceMock.send).toHaveBeenCalledWith({
      to: 'student@diagramflow.test',
      subject: 'Confirm your DiagramFlow email',
      text: expect.stringMatching(/\b\d{6}\b/),
    });
  });
});
