import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryIdParamDto, FilterCategoryDto } from './category.dto';
import { itemResponse, listResponse } from '../common/utils';

/**
 * Subcategories are Category documents that carry a `parentCategory`. They get
 * their own route because the frontend fetches /subcategories separately.
 */
@Controller('subcategories')
export class SubCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAllSubCategories(@Query() query: FilterCategoryDto) {
    const { categories, pagination } =
      await this.categoryService.findAllCategories(query, 'sub');
    return listResponse(categories, pagination);
  }

  @Get(':id')
  async findById(@Param() params: CategoryIdParamDto) {
    const category = await this.categoryService.findById(params.id);
    return itemResponse(category);
  }
}
