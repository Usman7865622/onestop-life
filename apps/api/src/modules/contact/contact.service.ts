import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({
      data: dto,
      select: { id: true, createdAt: true },
    });
  }

  listUnread() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  markRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, isRead: true },
    });
  }
}
