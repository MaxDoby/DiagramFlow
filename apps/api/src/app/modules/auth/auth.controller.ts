import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  registerSchema,
  RegisterInput,
  RegisterResponse,
  loginSchema,
  LoginInput,
  LoginResponse,
  RefreshResponse,
} from '@diagram-flow/contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie('diagramflow_refresh_token', token, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/api/auth',
    });
  }

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
    this.setRefreshTokenCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return result.response;
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponse> {
    const refreshToken = request.cookies?.diagramflow_refresh_token;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const result = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );
    return result.response;
  }
}
