import { Body, Controller, Post } from '@nestjs/common';
import {
  registerSchema,
  RegisterInput,
  RegisterResponse,
} from '@diagram-flow/contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema))
    input: RegisterInput,
  ): Promise<RegisterResponse> {
    return this.authService.register(input);
  }
}
