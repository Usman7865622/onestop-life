import { Controller, Get } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

/** Platform overview for the admin console. ADMIN only. */
@Roles(RoleKey.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('overview')
  overview() {
    return this.service.overview();
  }
}
