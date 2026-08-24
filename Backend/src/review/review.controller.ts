import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  AddReviewDto,
  FilterReviewDto,
  ProductIdParamDto,
  ReviewIdParamDto,
} from './review.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard)
  async addReview(
    @CurrentUser('id') userId: string,
    @Body() addReviewDto: AddReviewDto,
  ) {
    const review = await this.reviewService.addReview(userId, addReviewDto);
    return {
      success: true,
      message: 'Review added successfully',
      review,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteReview(
    @Param() params: ReviewIdParamDto,
    @CurrentUser() user: { id: string; role?: string },
  ) {
    const result = await this.reviewService.deleteReview(params.id, user);
    return result;
  }

  @Get('product/:productId')
  async getProductReviews(
    @Param() params: ProductIdParamDto,
    @Query() query: FilterReviewDto,
  ) {
    const result = await this.reviewService.getProductReviews(
      params.productId,
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async getReviewById(@Param() params: ReviewIdParamDto) {
    const review = await this.reviewService.getReviewById(params.id);
    return {
      success: true,
      review,
    };
  }
}
