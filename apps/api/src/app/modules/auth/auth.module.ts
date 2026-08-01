import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { EmailVerificationService } from './email-verification.service';
import { MailModule } from '../../infrastructure/mail/mail.module';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  providers: [AuthService, EmailVerificationService, AccessTokenGuard],
  imports: [
    PrismaModule,
    RedisModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  exports: [AccessTokenGuard, JwtModule],
})
export class AuthModule {}
