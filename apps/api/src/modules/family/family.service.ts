import { Injectable } from '@nestjs/common';
import { FamilyMember, FamilyRelationship, Prisma } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';

export type PublicFamilyMember = {
  id: string;
  fullName: string;
  relationship: FamilyRelationship;
  dateOfBirth: Date | null;
  gender: string | null;
  isSelf: boolean;
  createdAt: Date;
};

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  toPublic(member: FamilyMember): PublicFamilyMember {
    return {
      id: member.id,
      fullName: member.fullName,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      isSelf: member.isSelf,
      createdAt: member.createdAt,
    };
  }

  /**
   * Guarantee the account has its "Myself" profile. New signups get one at
   * creation (UsersService) and existing accounts were backfilled by the
   * migration; this covers any account created outside those paths (seeds,
   * imports). A partial unique index on (userId) WHERE isSelf keeps exactly
   * one self profile per account, so a racing create loses with P2002 and we
   * simply re-read the winner.
   */
  async ensureSelfProfile(userId: string): Promise<FamilyMember> {
    const existing = await this.prisma.familyMember.findFirst({
      where: { userId, isSelf: true, deletedAt: null },
    });
    if (existing) return existing;

    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    try {
      return await this.prisma.familyMember.create({
        data: {
          userId,
          fullName: account?.name?.trim() || 'Myself',
          relationship: FamilyRelationship.SELF,
          isSelf: true,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const winner = await this.prisma.familyMember.findFirst({
          where: { userId, isSelf: true, deletedAt: null },
        });
        if (winner) return winner;
      }
      throw e;
    }
  }

  /** The caller's household profiles: self first, then oldest first. Soft-deleted profiles never appear. */
  async listMine(user: AuthUser): Promise<PublicFamilyMember[]> {
    await this.ensureSelfProfile(user.id);
    const rows = await this.prisma.familyMember.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ isSelf: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((m) => this.toPublic(m));
  }
}
