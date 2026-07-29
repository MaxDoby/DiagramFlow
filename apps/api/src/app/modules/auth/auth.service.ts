import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  LoginInput,
  RegisterInput,
  RegisterResponse,
  LoginResponse,
} from '@diagram-flow/contracts';
import { Prisma } from '../../../generated/prisma/client';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

type LoginServiceResult = {
  response: LoginResponse;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

@Injectable()
export class AuthService {
  private static readonly PASSWORD_SALT_ROUNDS = 12;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async createRefreshSession(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const ttlDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_TTL_DAYS',
    );

    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  private async createAccessToken(user: {
    id: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
  }

  private async validateCredentials(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        avatarUrl: true,
        emailConfirmedAt: true,
      },
    });

    const passwordMatches = user
      ? await compare(input.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches)
      throw new UnauthorizedException('Invalid email or password.');

    return user;
  }

  async login(input: LoginInput): Promise<LoginServiceResult> {
    const user = await this.validateCredentials(input);

    const accessToken = await this.createAccessToken(user);

    const refreshSession = await this.createRefreshSession(user.id);

    const accessTokenExpiresInSeconds = this.configService.getOrThrow<number>(
      'JWT_ACCESS_TTL_SECONDS',
    );

    return {
      response: {
        accessToken,
        accessTokenExpiresInSeconds,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      },
      refreshToken: refreshSession.token,
      refreshTokenExpiresAt: refreshSession.expiresAt,
    };
  }

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const passwordHash = await hash(
      input.password,
      AuthService.PASSWORD_SALT_ROUNDS,
    );

    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          emailConfirmedAt: true,
        },
      });

      return {
        id: newUser.id,
        email: newUser.email,
        emailConfirmed: newUser.emailConfirmedAt !== null,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }
}
