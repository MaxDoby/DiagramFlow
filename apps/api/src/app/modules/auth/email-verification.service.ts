import {
  HttpException,
  HttpStatus,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  emailVerificationRecordSchema,
  type EmailVerificationRecord,
} from './schemas/email-verification-record.schema';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async createAndSendVerificationCode(
    normalizedEmail: string,
  ): Promise<string> {
    const code = this.generateOtpCode();
    const codeHash = this.hashOtpCode(normalizedEmail, code);

    const ttlSeconds = this.configService.getOrThrow<number>(
      'EMAIL_VERIFICATION_OTP_TTL_SECONDS',
    );

    const maxAttempts = this.configService.getOrThrow<number>(
      'EMAIL_VERIFICATION_MAX_ATTEMPTS',
    );

    const record: EmailVerificationRecord = {
      codeHash,
      attemptsRemaining: maxAttempts,
    };

    await this.redisService.setWithExpiration(
      this.buildOtpKey(normalizedEmail),
      JSON.stringify(record),
      ttlSeconds,
    );

    await this.mailService.send({
      to: normalizedEmail,
      subject: 'Confirm your DiagramFlow email',
      text:
        `Your DiagramFlow verification code is: ${code}\n\n` +
        `This code expires in ${Math.ceil(ttlSeconds / 60)} minutes.`,
    });

    return code;
  }

  private generateOtpCode(): string {
    const generatedOtpCode = randomInt(0, 1_000_000)
      .toString()
      .padStart(6, '0');
    return generatedOtpCode;
  }

  private hashOtpCode(email: string, code: string): string {
    const secret = this.configService.getOrThrow<string>(
      'EMAIL_VERIFICATION_OTP_SECRET',
    );
    return createHmac('sha256', secret)
      .update(`${email}:${code}`)
      .digest('hex');
  }

  private buildOtpKey(email: string): string {
    return `email-verification:otp:${email}`;
  }

  private buildCooldownKey(email: string): string {
    return `email-verification:cooldown:${email}`;
  }

  private async reserveCooldown(email: string): Promise<void> {
    const cooldownSeconds = this.configService.getOrThrow<number>(
      'EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS',
    );
    const wasReserved: boolean =
      await this.redisService.setIfAbsentWithExpiration(
        this.buildCooldownKey(email),
        '1',
        cooldownSeconds,
      );

    if (wasReserved === false)
      throw new HttpException(
        'Please wait before requesting another verification code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  async issueVerificationCode(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();

    await this.reserveCooldown(normalizedEmail);

    return this.createAndSendVerificationCode(normalizedEmail);
  }

  async resendVerificationCode(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    await this.reserveCooldown(normalizedEmail);
    const user = await this.prismaService.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        emailConfirmedAt: true,
      },
    });

    if (user === null || user.emailConfirmedAt !== null) {
      return;
    }

    await this.createAndSendVerificationCode(normalizedEmail);
  }

  private isOtpCodeValid(
    email: string,
    code: string,
    storedHash: string,
  ): boolean {
    const candidateHash = this.hashOtpCode(email, code);

    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, storedBuffer);
  }

  private parseVerificationRecord(
    value: string,
  ): EmailVerificationRecord | null {
    try {
      const result = emailVerificationRecordSchema.safeParse(JSON.parse(value));

      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  private async handleFailedAttempt(
    email: string,
    record: EmailVerificationRecord,
  ): Promise<void> {
    const otpKey = this.buildOtpKey(email);
    const ttlSeconds = await this.redisService.getTimeToLive(otpKey);
    const attemptsRemaining = record.attemptsRemaining - 1;

    if (attemptsRemaining <= 0 || ttlSeconds <= 0) {
      await this.redisService.deleteKey(otpKey);
      return;
    }

    const updatedRecord: EmailVerificationRecord = {
      ...record,
      attemptsRemaining,
    };

    await this.redisService.setWithExpiration(
      otpKey,
      JSON.stringify(updatedRecord),
      ttlSeconds,
    );
  }

  async confirmEmail(email: string, code: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const otpKey = this.buildOtpKey(normalizedEmail);
    const storedValue = await this.redisService.getValue(otpKey);

    if (storedValue === null)
      throw new BadRequestException('Invalid or expired verification code');

    const record = this.parseVerificationRecord(storedValue);

    if (record === null) {
      await this.redisService.deleteKey(otpKey);

      throw new BadRequestException('Invalid or expired verification code');
    }

    const result = this.isOtpCodeValid(normalizedEmail, code, record.codeHash);

    if (result === false) {
      await this.handleFailedAttempt(normalizedEmail, record);

      throw new BadRequestException('Invalid or expired verification code');
    }

    const updateResult = await this.prismaService.user.updateMany({
      where: {
        email: normalizedEmail,
        emailConfirmedAt: null,
      },
      data: {
        emailConfirmedAt: new Date(),
      },
    });

    await this.redisService.deleteKey(otpKey);

    if (updateResult.count === 0) {
      throw new BadRequestException('Invalid or expired verification code');
    }
  }
}
