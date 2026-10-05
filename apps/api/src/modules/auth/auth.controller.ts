import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { RequestMeta } from '../../common/types/auth-user';
import { Env } from '../../config/env.validation';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { EmailLoginDto, EmailSignUpDto } from './dto/email-auth.dto';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = '/auth'; // the browser only sends the cookie to /auth/*

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private meta(req: Request): RequestMeta {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  private setRefreshCookie(res: Response, token: string) {
    const days = this.config.get('REFRESH_TTL_DAYS', { infer: true });
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: 'lax',
      path: COOKIE_PATH,
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  @Post('otp/request')
  @HttpCode(202)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto);
  }

  @Post('email/signup')
  @HttpCode(201)
  async emailSignup(@Body() dto: EmailSignUpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.signUpWithEmail(dto, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('email/login')
  @HttpCode(200)
  async emailLogin(@Body() dto: EmailLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.loginWithEmail(dto, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.verifyOtp(dto, this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], this.meta(req));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
  }
}
