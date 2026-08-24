import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  FilterProductDto,
  ProductIdParamDto,
  UpdateProductDto,
} from './product.dto';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { multerOptions } from '../common/utils/multer.utils';
import { itemResponse, listResponse } from '../common/utils';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const imagePaths = files ? files.map((file) => file.path) : [];
    const product = await this.productService.createProduct(
      createProductDto,
      imagePaths,
      userId,
    );
    return {
      success: true,
      message: 'Product created successfully',
      product,
    };
  }
  @Get()
  async findAllProducts(@Query() query: FilterProductDto) {
    const { products, pagination } = await this.productService.findAllProducts(query);
    return listResponse(products, pagination);
  }
  @Get(':id')
  async findById(@Param() params: ProductIdParamDto) {
    const product = await this.productService.findById(params.id);
    return itemResponse(product);
  }
  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  async updateProduct(
    @Param() params: ProductIdParamDto,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const imagePaths = files && files.length > 0 ? files.map((file) => file.path) : undefined;
    const product = await this.productService.updateProduct(
      params.id,
      updateProductDto,
      imagePaths,
      userId,
    );
    return {
      success: true,
      message: 'Product updated successfully',
      product,
    };
  }
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param() params: ProductIdParamDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.productService.deleteProduct(params.id, userId);
    return {
      ...result,
    };
  }
}
