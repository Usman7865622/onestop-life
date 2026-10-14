import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthUser) {
    return this.prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  async create(user: AuthUser, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    const count = await this.prisma.address.count({ where: { userId: user.id } });
    return this.prisma.address.create({
      data: { ...dto, userId: user.id, isDefault: dto.isDefault ?? count === 0 },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    const { addressLabel, ...rest } = dto as UpdateAddressDto & { addressLabel?: string };
    return this.prisma.address.update({ where: { id }, data: { ...rest, label: addressLabel ?? rest.label } });
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }
}
