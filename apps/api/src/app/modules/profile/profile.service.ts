import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  profileResponseSchema,
  type ProfileResponse,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from '@diagram-flow/contracts';
import { Prisma } from '../../../generated/prisma/client';
import { compare, hash } from 'bcrypt';
import { PASSWORD_SALT_ROUNDS } from '../../common/constants/security.constants';
import { AvatarStorageService } from './avatar/avatar-storage.service';

type ProfileRecord = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailConfirmedAt: Date | null;
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  private toProfileResponse(user: ProfileRecord): ProfileResponse {
    return profileResponseSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      emailConfirmed: user.emailConfirmedAt !== null,
    });
  }

  private async deleteAvatarSafely(
    avatarUrl: string | null,
    failureMessage: string,
  ): Promise<void> {
    try {
      await this.avatarStorage.deleteByPublicUrl(avatarUrl);
    } catch (error: unknown) {
      this.logger.error(
        failureMessage,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailConfirmedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.toProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: input.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailConfirmedAt: true,
        },
      });

      return this.toProfileResponse(user);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }

  async updateAvatar(
    userId: string,
    fileName: string,
  ): Promise<ProfileResponse> {
    const newAvatarUrl = this.avatarStorage.buildPublicUrl(fileName);

    let previousAvatarUrl: string | null;
    let updatedUser: ProfileRecord;

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          avatarUrl: true,
        },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      previousAvatarUrl = existingUser.avatarUrl;

      updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          avatarUrl: newAvatarUrl,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailConfirmedAt: true,
        },
      });
    } catch (error: unknown) {
      await this.deleteAvatarSafely(
        newAvatarUrl,
        'Failed to delete orphaned avatar',
      );

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
    await this.deleteAvatarSafely(
      previousAvatarUrl,
      'Failed to delete previous avatar',
    );

    return this.toProfileResponse(updatedUser);
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordMatches = await compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await hash(input.newPassword, PASSWORD_SALT_ROUNDS);

    const revokedAt = new Date();

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.user.update({
          where: {
            id: userId,
          },
          data: {
            passwordHash: newPasswordHash,
          },
        });

        await transaction.refreshSession.updateMany({
          where: {
            userId,
            revokedAt: null,
          },
          data: {
            revokedAt,
          },
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }
}
