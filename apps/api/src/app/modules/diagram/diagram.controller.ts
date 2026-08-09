import { Controller, Post, UseGuards, Body, Get, Query } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiagramService } from './diagram.service';
import { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDiagramInput,
  createDiagramSchema,
  DiagramListQuery,
  diagramListQuerySchema,
  DiagramListResponse,
  DiagramSummaryResponse,
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
}
