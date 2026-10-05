import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import {
  ApproveDto,
  CreateVerificationDto,
  ListVerificationQueryDto,
  RejectDto,
} from './dto/verification.dto';
import { VerificationService } from './verification.service';

/** Endpoints for the applicant (any logged-in user). */
@Controller('verification-requests')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVerificationDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user.id);
  }
}

/** Review queue endpoints. ADMIN only. */
@Roles(RoleKey.ADMIN)
@Controller('admin/verification-requests')
export class AdminVerificationController {
  constructor(private readonly service: VerificationService) {}

  @Get()
  list(@Query() query: ListVerificationQueryDto) {
    return this.service.listAll(query);
  }

  @Post(':id/approve')
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: AuthUser,
    @Body() dto: ApproveDto,
  ) {
    return this.service.approve(id, admin.id, dto.note);
  }

  @Post(':id/reject')
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: AuthUser,
    @Body() dto: RejectDto,
  ) {
    return this.service.reject(id, admin.id, dto.note);
  }
}
