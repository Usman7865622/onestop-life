import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleKey } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { RequestMeta } from '../../common/types/auth-user';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  signAccessToken(user: { id: string; roles: { role: RoleKey }[] }): string {
    return this.jwt.sign({ sub: user.id, roles: user.roles.map((r) => r.role) });
  }

  /** Creates an opaque random refresh token. Only its hash is stored. */
  async issueRefreshToken(userId: string, meta: RequestMeta, familyId: string = randomUUID()): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    const days = this.config.get('REFRESH_TTL_DAYS', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: this.hashToken(raw),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip,
      },
    });
    return raw;
  }

  /**
   * Refresh-token rotation with reuse detection.
   * A token can be used exactly once. If an already-used token shows up again, someone has
   * a stolen copy, so we revoke the whole family and force a fresh login.
   */
  async rotate(raw: string, meta: RequestMeta): Promise<{ userId: string; refreshToken: string }> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hashToken(raw) } });
    if (!record) throw new UnauthorizedException();

    if (record.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException();
    }
    if (record.expiresAt < new Date()) throw new UnauthorizedException();

    // Atomic "use once": only one concurrent request can flip revokedAt from null.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count !== 1) throw new UnauthorizedException();

    const refreshToken = await this.issueRefreshToken(record.userId, meta, record.familyId);
    return { userId: record.userId, refreshToken };
  }

  /** Logout: revoke the presented token's whole family. */
  async revokeFamilyByRaw(raw: string): Promise<void> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hashToken(raw) } });
    if (!record) return;
    await this.prisma.refreshToken.updateMany({
      where: { familyId: record.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
