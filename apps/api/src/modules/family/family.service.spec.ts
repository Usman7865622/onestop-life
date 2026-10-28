import { FamilyRelationship, RoleKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FamilyService } from './family.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function member(overrides: Record<string, unknown> = {}) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    userId: USER_ID,
    fullName: 'Myself',
    relationship: FamilyRelationship.SELF,
    dateOfBirth: null,
    gender: null,
    isSelf: true,
    deletedAt: null,
    createdAt: new Date('2026-10-28T00:00:00Z'),
    updatedAt: new Date('2026-10-28T00:00:00Z'),
    ...overrides,
  };
}

function makeService(prisma: unknown) {
  return new FamilyService(prisma as PrismaService);
}

describe('FamilyService.ensureSelfProfile', () => {
  it('returns the existing self profile without creating one', async () => {
    const create = jest.fn();
    const prisma = {
      familyMember: { findFirst: jest.fn().mockResolvedValue(member()), create },
      user: { findUnique: jest.fn() },
    };
    const service = makeService(prisma);

    const result = await service.ensureSelfProfile(USER_ID);

    expect(result.isSelf).toBe(true);
    expect(create).not.toHaveBeenCalled();
    expect(prisma.familyMember.findFirst).toHaveBeenCalledWith({
      where: { userId: USER_ID, isSelf: true, deletedAt: null },
    });
  });

  it('creates the self profile from the account name when missing', async () => {
    const created = member({ fullName: 'Muhammad Usman' });
    const prisma = {
      familyMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(created),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ name: 'Muhammad Usman' }) },
    };
    const service = makeService(prisma);

    const result = await service.ensureSelfProfile(USER_ID);

    expect(result.fullName).toBe('Muhammad Usman');
    expect(prisma.familyMember.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        fullName: 'Muhammad Usman',
        relationship: FamilyRelationship.SELF,
        isSelf: true,
      },
    });
  });

  it('falls back to "Myself" when the account has no name yet (phone signup)', async () => {
    const prisma = {
      familyMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(member()),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ name: null }) },
    };
    const service = makeService(prisma);

    await service.ensureSelfProfile(USER_ID);

    expect(prisma.familyMember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ fullName: 'Myself', isSelf: true }),
    });
  });
});

describe('FamilyService.listMine', () => {
  it('lists only the caller\'s non-deleted profiles, self first', async () => {
    const child = member({
      id: '33333333-3333-4333-8333-333333333333',
      fullName: 'Ahmed',
      relationship: FamilyRelationship.CHILD,
      isSelf: false,
      createdAt: new Date('2026-10-28T01:00:00Z'),
    });
    const prisma = {
      familyMember: {
        findFirst: jest.fn().mockResolvedValue(member()),
        findMany: jest.fn().mockResolvedValue([member(), child]),
        create: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };
    const service = makeService(prisma);

    const result = await service.listMine({ id: USER_ID, roles: [RoleKey.CUSTOMER] });

    expect(prisma.familyMember.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, deletedAt: null },
      orderBy: [{ isSelf: 'desc' }, { createdAt: 'asc' }],
    });
    expect(result.map((m) => m.fullName)).toEqual(['Myself', 'Ahmed']);
    expect(result[0].isSelf).toBe(true);
    // Public shape must not leak bookkeeping fields.
    expect(result[0]).not.toHaveProperty('userId');
    expect(result[0]).not.toHaveProperty('deletedAt');
  });
});
