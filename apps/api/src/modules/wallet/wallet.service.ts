import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user';

const MAX_TOPUP_MINOR = 10000000; // Rs. 100,000 per top-up (test mode)

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async balance(user: AuthUser) {
    const row = await this.prisma.user.findUnique({ where: { id: user.id }, select: { walletBalanceMinor: true } });
    if (!row) throw new NotFoundException('User not found');
    return { balanceMinor: row.walletBalanceMinor };
  }

  transactions(user: AuthUser) {
    return this.prisma.walletTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  /** Test-mode top-up: credits the wallet instantly. No real money moves. */
  async topup(user: AuthUser, amountMinor: number) {
    if (!Number.isInteger(amountMinor) || amountMinor <= 0 || amountMinor > MAX_TOPUP_MINOR) {
      throw new BadRequestException('Top-up amount must be between Rs. 1 and Rs. 100,000');
    }
    const reference = `topup_test_${Date.now()}`;
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { walletBalanceMinor: { increment: amountMinor } } }),
      this.prisma.walletTransaction.create({ data: { userId: user.id, amountMinor, type: 'TOPUP', reference } }),
    ]);
    return { balanceMinor: updated.walletBalanceMinor, reference };
  }

  /** Deducts for an order. Throws when the balance is insufficient. */
  async deduct(userId: string, amountMinor: number, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalanceMinor: true } });
      if (!user) throw new NotFoundException('User not found');
      if (user.walletBalanceMinor < amountMinor) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      const updated = await tx.user.update({ where: { id: userId }, data: { walletBalanceMinor: { decrement: amountMinor } } });
      await tx.walletTransaction.create({ data: { userId, amountMinor: -amountMinor, type: 'PURCHASE', reference } });
      return updated.walletBalanceMinor;
    });
  }

  /** Credits a refund back to the wallet. */
  async refund(userId: string, amountMinor: number, reference: string) {
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { walletBalanceMinor: { increment: amountMinor } } }),
      this.prisma.walletTransaction.create({ data: { userId, amountMinor, type: 'REFUND', reference } }),
    ]);
    return updated.walletBalanceMinor;
  }
}
