import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { BloodService } from './blood.service';
import { CreateBloodRequestDto, ListBloodBanksQueryDto, ListBloodRequestsQueryDto } from './dto/blood.dto';

@Controller()
export class BloodController {
  constructor(private readonly blood: BloodService) {}

  @Get('blood-banks')
  @Public()
  listBloodBanks(@Query() query: ListBloodBanksQueryDto) {
    return this.blood.listBloodBanks(query);
  }

  @Get('blood-requests')
  @Public()
  listPublicRequests(@Query() query: ListBloodRequestsQueryDto) {
    return this.blood.listPublicRequests(query);
  }

  @Post('blood-requests')
  createRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateBloodRequestDto) {
    return this.blood.createRequest(user, dto);
  }

  @Get('blood-requests/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.blood.listMine(user);
  }

  @Patch('blood-requests/:id/cancel')
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.blood.cancel(id, user);
  }
}
