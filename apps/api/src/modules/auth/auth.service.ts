import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { normalizePkMobile } from '../../common/phone';
import { RequestMeta } from '../../common/types/auth-user';
import { Env } from '../../config/env.validation';
import { UsersService } from '../users/users.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { EmailLoginDto, EmailSignUpDto } from './dto/email-auth.dto';

const scrypt = promisify(nodeScrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private requirePhone(input: string): string {
    const phone = normalizePkMobile(input);
    if (!phone) throw new BadRequestException('Enter a valid Pakistani mobile number, e.g. 0300 1234567');
    return phone;
  }

  requestOtp(dto: RequestOtpDto) {
    return this.otp.request(this.requirePhone(dto.phone));
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(password, salt, 64) as Buffer;
    return `${salt}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, encoded] = stored.split(':');
    if (!salt || !encoded) return false;
    const expected = Buffer.from(encoded, 'hex');
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  async signUpWithEmail(dto: EmailSignUpDto, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) throw new ConflictException('An account with this email already exists');
    const user = await this.users.createEmailUser(email, await this.hashPassword(dto.password), dto.name);
    await this.users.markEmailLogin(user);
    const refreshToken = await this.tokens.issueRefreshToken(user.id, meta);
    return { accessToken: this.tokens.signAccessToken(user), refreshToken, user: this.users.toPublic(user) };
  }

  async loginWithEmail(dto: EmailLoginDto, meta: RequestMeta) {
    const user = await this.users.findByEmail(dto.email.trim().toLowerCase());
    if (!user?.passwordHash || !(await this.verifyPassword(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('This account is suspended');
    await this.users.markEmailLogin(user);
    const refreshToken = await this.tokens.issueRefreshToken(user.id, meta);
    return { accessToken: this.tokens.signAccessToken(user), refreshToken, user: this.users.toPublic(user) };
  }

  /**
   * "Continue with Google": verify the ID token against Google's keys, then resolve
   * the account — by stored Google id first, then by verified email (linking the
   * Google identity onto an existing account), else create a fresh CUSTOMER account
   * (same default as phone OTP sign-up; professional roles still come via verification).
   */
  async loginWithGoogle(idToken: string, meta: RequestMeta) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    if (!clientId) throw new BadRequestException('Google sign-in is not available right now');

    let email: string;
    let googleSub: string;
    let name: string | undefined;
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) throw new Error('incomplete token');
      if (payload.email_verified === false) throw new Error('email not verified');
      email = payload.email.trim().toLowerCase();
      googleSub = payload.sub;
      name = payload.name;
    } catch {
      throw new UnauthorizedException('Google sign-in failed. Please try again.');
    }

    let user = await this.users.findByGoogleSub(googleSub);
    if (!user) {
      const byEmail = await this.users.findByEmail(email);
      if (byEmail) {
        user = await this.users.linkGoogle(byEmail.id, googleSub);
      } else {
        try {
          user = await this.users.createGoogleUser(email, name, googleSub);
        } catch (e) {
          // Racing first-time sign-ins: the loser hits the unique constraint, so reload.
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
          const again = (await this.users.findByGoogleSub(googleSub)) ?? (await this.users.findByEmail(email));
          if (!again) throw e;
          user = again.googleSub ? again : await this.users.linkGoogle(again.id, googleSub);
        }
      }
    }

    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('This account is suspended');
    await this.users.markGoogleLogin(user.id);
    const refreshToken = await this.tokens.issueRefreshToken(user.id, meta);
    return { accessToken: this.tokens.signAccessToken(user), refreshToken, user: this.users.toPublic(user) };
  }

  async verifyOtp(dto: VerifyOtpDto, meta: RequestMeta) {
    const phone = this.requirePhone(dto.phone);
    await this.otp.verify(phone, dto.code);

    const user = await this.users.findOrCreateByPhone(phone);
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('This account is suspended');

    await this.users.markLogin(user);
    const refreshToken = await this.tokens.issueRefreshToken(user.id, meta);
    return { accessToken: this.tokens.signAccessToken(user), refreshToken, user: this.users.toPublic(user) };
  }

  async refresh(rawRefreshToken: string | undefined, meta: RequestMeta) {
    if (!rawRefreshToken) throw new UnauthorizedException();
    const { userId, refreshToken } = await this.tokens.rotate(rawRefreshToken, meta);

    // Roles are re-read from the database here, so a newly approved doctor gets the DOCTOR role
    // in the next access token without logging in again.
    const user = await this.users.findByIdWithRoles(userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.tokens.revokeAllForUser(userId);
      throw new UnauthorizedException();
    }
    return { accessToken: this.tokens.signAccessToken(user), refreshToken, user: this.users.toPublic(user) };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) await this.tokens.revokeFamilyByRaw(rawRefreshToken);
  }
}
