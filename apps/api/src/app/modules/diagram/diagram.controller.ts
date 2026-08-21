import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiagramService } from './diagram.service';
import { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDiagramInput,
  createDiagramSchema,
  DiagramDetailsResponse,
  DiagramListQuery,
  diagramListQuerySchema,
  DiagramListResponse,
  DiagramParams,
  diagramParamsSchema,
  DiagramSummaryResponse,
  UpdateDiagramInput,
  updateDiagramSchema,
  SaveDiagramSnapshotInput,
  SaveDiagramSnapshotResponse,
  saveDiagramSnapshotSchema,
} from '@diagram-flow/contracts';

@Controller('diagrams')
@UseGuards(AccessTokenGuard)
export class DiagramController {
  constructor(private readonly diagramService: DiagramService) {}

  @Get()
  listDiagrams(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidationPipe(diagramListQuerySchema))
    query: DiagramListQuery,
  ): Promise<DiagramListResponse> {
    return this.diagramService.listDiagrams(user.sub, query.folderId);
  }

  @Post()
  createDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createDiagramSchema)) input: CreateDiagramInput,
  ): Promise<DiagramSummaryResponse> {
    return this.diagramService.createDiagram(user.sub, input);
  }

  @Post(':diagramId/duplicate')
  duplicateDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(diagramParamsSchema))
    params: DiagramParams,
  ): Promise<DiagramSummaryResponse> {
    return this.diagramService.duplicateDiagram(user.sub, params.diagramId);
  }

  @Get(':diagramId')
  getDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(diagramParamsSchema))
    params: DiagramParams,
  ): Promise<DiagramDetailsResponse> {
    return this.diagramService.getDiagram(user.sub, params.diagramId);
  }

  @Patch(':diagramId')
  updateDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(diagramParamsSchema))
    params: DiagramParams,
    @Body(new ZodValidationPipe(updateDiagramSchema))
    input: UpdateDiagramInput,
  ): Promise<DiagramSummaryResponse> {
    return this.diagramService.updateDiagram(user.sub, params.diagramId, input);
  }

  @Put(':diagramId/snapshot')
  saveSnapshot(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(diagramParamsSchema))
    params: DiagramParams,
    @Body(new ZodValidationPipe(saveDiagramSnapshotSchema))
    input: SaveDiagramSnapshotInput,
  ): Promise<SaveDiagramSnapshotResponse> {
    return this.diagramService.saveSnapshot(user.sub, params.diagramId, input);
  }

  @Delete(':diagramId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Param(new ZodValidationPipe(diagramParamsSchema))
    params: DiagramParams,
  ): Promise<void> {
    return this.diagramService.deleteDiagram(user.sub, params.diagramId);
  }
}
