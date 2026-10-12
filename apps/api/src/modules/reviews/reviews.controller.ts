import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateReviewDto, ListReviewsQueryDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('reviews')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user, dto);
  }

  @Get('doctors/:id/reviews')
  @Public()
  listByDoctor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    const page = Number.parseInt(query.page ?? '1', 10) || 1;
    const pageSize = Number.parseInt(query.pageSize ?? '10', 10) || 10;
    return this.reviews.listByDoctor(id, page, pageSize);
  }

  @Get('reviews/latest')
  @Public()
  latest() {
    return this.reviews.latest(6);
  }

  @Get('appointments/:id/review-eligibility')
  eligibility(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.reviews.eligibility(id, user);
  }

  @Delete('reviews/:id')
  deleteMine(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthUser) {
    return this.reviews.deleteMine(id, user);
  }
}
