import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateFacilityDto, ListFacilitiesQueryDto } from './dto/create-facility.dto';
import { FacilitiesService } from './facilities.service';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilities: FacilitiesService) {}

  @Get()
  @Public()
  list(@Query() query: ListFacilitiesQueryDto) {
    return this.facilities.list(query);
  }

  @Get(':id')
  @Public()
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.facilities.getById(id);
  }

  @Post()
  @Roles(RoleKey.ADMIN)
  create(@Body() dto: CreateFacilityDto) {
    return this.facilities.create(dto);
  }
}
