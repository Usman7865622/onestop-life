import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { DoctorSlotsController } from './doctor-slots.controller';
import { AvailabilityService } from './availability.service';

@Module({
  controllers: [AvailabilityController, DoctorSlotsController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
