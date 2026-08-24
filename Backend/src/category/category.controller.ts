import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  CategoryIdParamDto,
  FilterCategoryDto,
  UpdateCategoryDto,
} from './category.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { multerOptions } from '../common/utils/multer.utils';
import { itemResponse, listResponse } from '../common/utils';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const category = await this.categoryService.createCategory(
      createCategoryDto,
      file?.path,
      userId,
    );
    return {
      success: true,
      message: 'Category created successfully',
      category,
    };
  }

  @Get()
  async findAllCategories(@Query() query: FilterCategoryDto) {
    const { categories, pagination } = await this.categoryService.findAllCategories(query);
    return listResponse(categories, pagination);
  }

  @Get(':id')
  async findById(@Param() params: CategoryIdParamDto) {
    const category = await this.categoryService.findById(params.id);
    return itemResponse(category);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updateCategory(
    @Param() params: CategoryIdParamDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const category = await this.categoryService.updateCategory(
      params.id,
      updateCategoryDto,
      file?.path,
      userId,
    );
    return {
      success: true,
      message: 'Category updated successfully',
      category,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteCategory(
    @Param() params: CategoryIdParamDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.categoryService.deleteCategory(params.id, userId);
    return {
      ...result,
    };
  }
}
