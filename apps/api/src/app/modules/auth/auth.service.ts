import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { hash } from 'bcrypt';
import type { RegisterInput, RegisterResponse } from '@diagram-flow/contracts';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AuthService {
  private static readonly PASSWORD_SALT_ROUNDS = 12;
  constructor(private readonly prisma: PrismaService) {}

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
