import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiagramService } from './diagram.service';
import { AccessTokenPayload } from '../auth/schemas/access-token-payload.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateDiagramInput,
  createDiagramSchema,
  DiagramSummaryResponse,
} from '@diagram-flow/contracts';

@Controller('diagrams')
@UseGuards(AccessTokenGuard)
export class DiagramController {
  constructor(private readonly diagramService: DiagramService) {}

  @Post()
  createDiagram(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createDiagramSchema)) input: CreateDiagramInput,
  ): Promise<DiagramSummaryResponse> {
    return this.diagramService.createDiagram(user.sub, input);
  }
}
