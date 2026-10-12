import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AvailabilityService } from './availability.service';

/**
 * Public read endpoints for real doctor availability. Mounted under /doctors so
 * patients can discover free slots from the doctor detail page.
 */
@Controller('doctors')
export class DoctorSlotsController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get(':id/slots')
  @Public()
  slots(@Param('id', new ParseUUIDPipe()) id: string, @Query('date') date: string) {
    if (!date) throw new BadRequestException('Query param "date" (YYYY-MM-DD) is required');
    return this.availability.computeDaySlots(id, date);
  }

  @Get(':id/available-dates')
  @Public()
  availableDates(@Param('id', new ParseUUIDPipe()) id: string, @Query('month') month?: string) {
    return this.availability.computeAvailableDates(id, month);
  }
}
