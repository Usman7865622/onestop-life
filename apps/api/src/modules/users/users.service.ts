import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleKey, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

export type UserWithRoles = User & { roles: UserRole[] };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toPublic(user: UserWithRoles) {
    return {
      id: user.id,
      phone: user.phone ?? '',
      name: user.name,
      email: user.email,
      locale: user.locale,
      roles: user.roles.map((r) => r.role),
    };
  }

  findByIdWithRoles(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { roles: true } });
  }

  async findOrCreateByPhone(phone: string): Promise<UserWithRoles> {
    const existing = await this.prisma.user.findUnique({ where: { phone }, include: { roles: true } });
    if (existing) return existing;

    try {
      return await this.prisma.user.create({
        data: { phone, phoneVerifiedAt: new Date(), roles: { create: { role: RoleKey.CUSTOMER } } },
        include: { roles: true },
      });
    } catch (e) {
      // Two first-time logins racing: the loser hits the unique constraint, so load the winner's row.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await this.prisma.user.findUnique({ where: { phone }, include: { roles: true } });
        if (again) return again;
      }
      throw e;
    }
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { roles: true } });
  }

  createEmailUser(email: string, passwordHash: string, name?: string): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: { email, passwordHash, name: name?.trim() || undefined, roles: { create: { role: RoleKey.CUSTOMER } } },
      include: { roles: true },
    });
  }

  markEmailLogin(user: User): Promise<void> {
    return this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).then(() => undefined);
  }

  async markLogin(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() },
    });
  }

  async getMe(id: string) {
    const user = await this.findByIdWithRoles(id);
    if (!user) throw new NotFoundException();
    return this.toPublic(user);
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { name: dto.name, email: dto.email, locale: dto.locale },
        include: { roles: true },
      });
      return this.toPublic(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This email is already in use');
      }
      throw e;
    }
  }
}
