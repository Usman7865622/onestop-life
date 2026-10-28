import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { FamilyService } from './family.service';

@Controller('family')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.family.listMine(user);
  }
}
