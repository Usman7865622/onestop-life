import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, RoleKey } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

// Small profanity guard for patient reviews. Kept deliberately narrow:
// it blocks only unambiguous vulgar terms and never blocks clinical words.
const BLOCKED_TERMS = [
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'slut', 'whore',
  'bastard', 'cunt', 'motherfucker', 'chutiya', 'bhosdike', 'madarchod',
];

function containsBlocked(text: string): boolean {
  const lowered = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(lowered));
}

const reviewInclude = {
  user: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateReviewDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      select: { id: true, patientId: true, doctorProfileId: true, status: true, review: { select: { id: true } } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.patientId !== user.id) {
      throw new ForbiddenException('You can only review your own appointments');
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Reviews are only allowed after a completed visit');
    }
    if (appointment.review) {
      throw new BadRequestException('This appointment has already been reviewed');
    }
    const text = dto.text.trim();
    const title = dto.title?.trim() || undefined;
    if (containsBlocked(text) || (title && containsBlocked(title))) {
      throw new BadRequestException('Review text contains language that is not allowed');
    }
    return this.prisma.review.create({
      data: {
        appointmentId: appointment.id,
        doctorProfileId: appointment.doctorProfileId,
        userId: user.id,
        rating: dto.rating,
        title,
        text,
      },
      include: reviewInclude,
    });
  }

  async listByDoctor(doctorProfileId: string, page = 1, pageSize = 10) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: doctorProfileId }, select: { id: true } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const skip = (Math.max(page, 1) - 1) * Math.min(Math.max(pageSize, 1), 50);
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { doctorProfileId },
        include: reviewInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(Math.max(pageSize, 1), 50),
      }),
      this.prisma.review.count({ where: { doctorProfileId } }),
    ]);
    return { items, total, page: Math.max(page, 1), pageSize: Math.min(Math.max(pageSize, 1), 50) };
  }

  async latest(limit = 6) {
    const items = await this.prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true } },
        doctorProfile: { select: { id: true, speciality: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 20),
    });
    return { items };
  }

  async deleteMine(id: string, user: AuthUser) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    const isAuthor = review.userId === user.id;
    const isAdmin = user.roles.includes(RoleKey.ADMIN);
    if (!isAuthor && !isAdmin) throw new ForbiddenException('You cannot delete this review');
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }

  async eligibility(appointmentId: string, user: AuthUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, patientId: true, status: true, review: { select: { id: true } } },
    });
    if (!appointment || appointment.patientId !== user.id) {
      return { canReview: false, reason: 'NOT_YOURS' as const };
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      return { canReview: false, reason: 'NOT_COMPLETED' as const };
    }
    if (appointment.review) {
      return { canReview: false, reason: 'ALREADY_REVIEWED' as const };
    }
    return { canReview: true, reason: 'ELIGIBLE' as const };
  }
}
