import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  registerSchema,
  RegisterInput,
  RegisterResponse,
  loginSchema,
  LoginInput,
  LoginResponse,
} from '@diagram-flow/contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema))
    input: RegisterInput,
  ): Promise<RegisterResponse> {
    return this.authService.register(input);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    input: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(input);

    response.cookie('diagramflow_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: result.refreshTokenExpiresAt,
      path: '/api/auth',
    });

    return result.response;
  }
}
