import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateLabBookingDto, ListLabTestsQueryDto } from './dto/lab.dto';
import { LabsService } from './labs.service';

@Controller()
export class LabsController {
  constructor(private readonly labs: LabsService) {}

  @Get('lab-tests')
  @Public()
  listTests(@Query() query: ListLabTestsQueryDto) {
    return this.labs.listTests(query);
  }

  @Get('lab-tests/:id')
  @Public()
  getTest(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.labs.getTest(id);
  }

  @Post('lab-bookings')
  createBooking(@CurrentUser() user: AuthUser, @Body() dto: CreateLabBookingDto) {
    return this.labs.createBooking(user, dto);
  }

  @Get('lab-bookings/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.labs.listMine(user);
  }

  @Patch('lab-bookings/:id/cancel')
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.labs.cancel(id, user);
  }
}
