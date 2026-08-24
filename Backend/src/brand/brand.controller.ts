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
import { BrandService } from './brand.service';
import {
  BrandIdParamDto,
  CreateBrandDto,
  FilterBrandDto,
  UpdateBrandDto,
} from './brand.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { multerOptions } from '../common/utils/multer.utils';
import { itemResponse, listResponse } from '../common/utils';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createBrand(
    @Body() createBrandDto: CreateBrandDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const brand = await this.brandService.createBrand(
      createBrandDto,
      file?.path,
      userId,
    );
    return {
      success: true,
      message: 'Brand created successfully',
      brand,
    };
  }

  @Get()
  async findAllBrands(@Query() query: FilterBrandDto) {
    const { brands, pagination } = await this.brandService.findAllBrands(query);
    return listResponse(brands, pagination);
  }

  @Get(':id')
  async findById(@Param() params: BrandIdParamDto) {
    const brand = await this.brandService.findById(params.id);
    return itemResponse(brand);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async updateBrand(
    @Param() params: BrandIdParamDto,
    @Body() updateBrandDto: UpdateBrandDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const brand = await this.brandService.updateBrand(
      params.id,
      updateBrandDto,
      file?.path,
      userId,
    );
    return {
      success: true,
      message: 'Brand updated successfully',
      brand,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteBrand(
    @Param() params: BrandIdParamDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.brandService.deleteBrand(params.id, userId);
    return {
      ...result,
    };
  }
}
