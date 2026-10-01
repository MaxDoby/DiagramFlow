import {
  Controller,
  Body,
  Post,
  UseGuards,
  Get,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  createFolderSchema,
  type CreateFolderInput,
  type FolderResponse,
  type FolderListResponse,
  folderParamsSchema,
  updateFolderSchema,
  type FolderParams,
  type UpdateFolderInput,
} from '@diagram-flow/contracts';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FolderService } from './folder.service';

@Controller('folders')
@UseGuards(AccessTokenGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  createFolder(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createFolderSchema)) input: CreateFolderInput,
  ): Promise<FolderResponse> {
    return this.folderService.createFolder(user.sub, input);
  }

  @Get()
  listFolders(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<FolderListResponse> {
    return this.folderService.listFolders(user.sub);
  }

  @Patch(':folderId')
  renameFolder(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(folderParamsSchema)) params: FolderParams,
    @Body(new ZodValidationPipe(updateFolderSchema)) input: UpdateFolderInput,
  ): Promise<FolderResponse> {
    return this.folderService.renameFolder(user.sub, params.folderId, input);
  }

  @Delete(':folderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFolder(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(folderParamsSchema))
    params: FolderParams,
  ): Promise<void> {
    return this.folderService.deleteFolder(user.sub, params.folderId);
  }
}
