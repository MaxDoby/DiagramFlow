import {
  Controller,
  Get,
  UseGuards,
  Body,
  Patch,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  updateProfileSchema,
  type ProfileResponse,
  type UpdateProfileInput,
  changePasswordSchema,
  type ChangePasswordInput,
} from '@diagram-flow/contracts';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';
import { ProfileService } from './profile.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('profile')
@UseGuards(AccessTokenGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ProfileResponse> {
    return this.profileService.getProfile(user.sub);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateProfileSchema))
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    return this.profileService.updateProfile(user.sub, input);
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ProfileResponse> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    return this.profileService.updateAvatar(user.sub, file.filename);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('password')
  async changePassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(changePasswordSchema))
    input: ChangePasswordInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.profileService.changePassword(user.sub, input);

    response.clearCookie('diagramflow_refresh_token', {
      path: '/api/auth',
    });
  }
}
