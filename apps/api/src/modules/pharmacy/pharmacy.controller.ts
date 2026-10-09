import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ListMedicinesQueryDto } from './dto/list-medicines.dto';
import { PharmacyService } from './pharmacy.service';

@Controller('medicines')
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Get()
  @Public()
  list(@Query() query: ListMedicinesQueryDto) {
    return this.pharmacy.list(query);
  }

  @Get('classes')
  @Public()
  classes() {
    return this.pharmacy.classes();
  }

  @Get(':id')
  @Public()
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pharmacy.getById(id);
  }
}
