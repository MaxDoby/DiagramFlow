import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ProfileService } from './profile.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { AvatarStorageService } from './avatar/avatar-storage.service';

describe('ProfileService', () => {
  let service: ProfileService;

  let prismaServiceMock: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let transactionMock: {
    user: {
      update: jest.Mock;
    };
    refreshSession: {
      updateMany: jest.Mock;
    };
  };
  let avatarStorageMock: {
    buildPublicUrl: jest.Mock;
    deleteByPublicUrl: jest.Mock;
  };

  beforeEach(() => {
    avatarStorageMock = {
      buildPublicUrl: jest.fn(),
      deleteByPublicUrl: jest.fn(),
    };

    transactionMock = {
      user: {
        update: jest.fn(),
      },
      refreshSession: {
        updateMany: jest.fn(),
      },
    };

    prismaServiceMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(
        (callback: (transaction: typeof transactionMock) => Promise<void>) =>
          callback(transactionMock),
      ),
    };

    service = new ProfileService(
      prismaServiceMock as unknown as PrismaService,
      avatarStorageMock as unknown as AvatarStorageService,
    );
  });

  it('returns the authenticated user profile', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: userId,
      email: 'student@diagramflow.test',
      name: 'Student',
      avatarUrl: null,
      emailConfirmedAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    const result = await service.getProfile(userId);

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
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

    expect(result).toEqual({
      id: userId,
      email: 'student@diagramflow.test',
      name: 'Student',
      avatarUrl: null,
      emailConfirmed: true,
    });
  });

  it('rejects the request when the user no longer exists', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    prismaServiceMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates and returns the authenticated user profile', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';

    prismaServiceMock.user.update.mockResolvedValue({
      id: userId,
      email: 'student@diagramflow.test',
      name: 'Updated Student',
      avatarUrl: null,
      emailConfirmedAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    const result = await service.updateProfile(userId, {
      name: 'Updated Student',
    });

    expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
      where: {
        id: userId,
      },
      data: {
        name: 'Updated Student',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailConfirmedAt: true,
      },
    });

    expect(result).toEqual({
      id: userId,
      email: 'student@diagramflow.test',
      name: 'Updated Student',
      avatarUrl: null,
      emailConfirmed: true,
    });
  });

  it('changes the password and revokes active refresh sessions', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword456!';
    const currentPasswordHash = await hash(currentPassword, 4);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      passwordHash: currentPasswordHash,
    });

    await service.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmNewPassword: newPassword,
    });

    expect(transactionMock.user.update).toHaveBeenCalledWith({
      where: {
        id: userId,
      },
      data: {
        passwordHash: expect.any(String),
      },
    });

    const updateInput = transactionMock.user.update.mock.calls[0][0] as {
      data: {
        passwordHash: string;
      };
    };

    expect(await compare(newPassword, updateInput.data.passwordHash)).toBe(
      true,
    );

    expect(transactionMock.refreshSession.updateMany).toHaveBeenCalledWith({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it('rejects an incorrect current password', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const storedPasswordHash = await hash('CorrectCurrentPassword123!', 4);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      passwordHash: storedPasswordHash,
    });

    await expect(
      service.changePassword(userId, {
        currentPassword: 'IncorrectCurrentPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaServiceMock.$transaction).not.toHaveBeenCalled();
  });

  it('updates the avatar and deletes the previous local file', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const fileName = '22222222-2222-4222-8222-222222222222.webp';
    const newAvatarUrl = `/uploads/avatars/${fileName}`;
    const previousAvatarUrl =
      '/uploads/avatars/33333333-3333-4333-8333-333333333333.webp';

    avatarStorageMock.buildPublicUrl.mockReturnValue(newAvatarUrl);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      avatarUrl: previousAvatarUrl,
    });

    prismaServiceMock.user.update.mockResolvedValue({
      id: userId,
      email: 'student@diagramflow.test',
      name: 'Student',
      avatarUrl: newAvatarUrl,
      emailConfirmedAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    const result = await service.updateAvatar(userId, fileName);

    expect(avatarStorageMock.buildPublicUrl).toHaveBeenCalledWith(fileName);

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: userId,
      },
      select: {
        avatarUrl: true,
      },
    });

    expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
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

    expect(avatarStorageMock.deleteByPublicUrl).toHaveBeenCalledWith(
      previousAvatarUrl,
    );

    expect(result.avatarUrl).toBe(newAvatarUrl);
  });

  it('deletes the new avatar when the database update fails', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const fileName = '22222222-2222-4222-8222-222222222222.webp';
    const newAvatarUrl = `/uploads/avatars/${fileName}`;
    const databaseError = new Error('Database update failed');

    avatarStorageMock.buildPublicUrl.mockReturnValue(newAvatarUrl);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      avatarUrl: null,
    });

    prismaServiceMock.user.update.mockRejectedValue(databaseError);

    await expect(service.updateAvatar(userId, fileName)).rejects.toBe(
      databaseError,
    );

    expect(avatarStorageMock.deleteByPublicUrl).toHaveBeenCalledTimes(1);

    expect(avatarStorageMock.deleteByPublicUrl).toHaveBeenCalledWith(
      newAvatarUrl,
    );
  });
});
