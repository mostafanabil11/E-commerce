import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { SubCategoryController } from './subcategory.controller';
import { Category, CategorySchema } from '../DB/Models/category.model';
import { Product, ProductSchema } from '../DB/Models/product.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') ?? '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CategoryService],
  controllers: [CategoryController, SubCategoryController],
  exports: [CategoryService],
})
export class CategoryModule {}
