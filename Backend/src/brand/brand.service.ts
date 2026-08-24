import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from '../DB/Models/brand.model';
import { Category, CategoryDocument } from '../DB/Models/category.model';
import { CreateBrandDto, FilterBrandDto, UpdateBrandDto } from './brand.dto';
import { RedisService } from '../common/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  private async invalidateBrandCache() {
    if (this.redisService) {
      try {
        await this.redisService.delByPattern('brands:*');
      } catch {
        // Ignore cache deletion errors
      }
    }
  }

  async createBrand(
    createBrandDto: CreateBrandDto,
    imageUrl: string | undefined,
    userId: string,
  ) {
    const existingBrand = await this.brandModel.findOne({
      name: createBrandDto.name.trim(),
    });
    if (existingBrand) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new BadRequestException('Brand with this name already exists');
    }

    if (!Types.ObjectId.isValid(createBrandDto.category)) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new BadRequestException('Invalid category ID');
    }

    const categoryExists = await this.categoryModel.findOne({
      _id: createBrandDto.category,
      deletedAt: null,
    });
    if (!categoryExists) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new NotFoundException('Category not found');
    }

    const slug = createBrandDto.name.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedImage = imageUrl ? imageUrl.replace(/\\/g, '/') : undefined;

    const newBrand = new this.brandModel({
      ...createBrandDto,
      slug,
      image: normalizedImage,
      createdBy: userId,
    });

    const saved = await newBrand.save();
    await this.invalidateBrandCache();
    return saved;
  }

  async updateBrand(
    id: string,
    updateBrandDto: UpdateBrandDto,
    imageUrl?: string,
    userId?: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new BadRequestException('Invalid brand ID');
    }

    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null });
    if (!brand) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new NotFoundException('Brand not found');
    }

    if (updateBrandDto.name) {
      const existingBrand = await this.brandModel.findOne({
        name: updateBrandDto.name.trim(),
        _id: { $ne: id },
      });
      if (existingBrand) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Brand name already exists');
      }
      brand.name = updateBrandDto.name.trim();
      brand.slug = updateBrandDto.name.toLowerCase().trim().replace(/\s+/g, '-');
    }

    if (updateBrandDto.category) {
      if (!Types.ObjectId.isValid(updateBrandDto.category)) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Invalid category ID');
      }
      const categoryExists = await this.categoryModel.findOne({
        _id: updateBrandDto.category,
        deletedAt: null,
      });
      if (!categoryExists) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new NotFoundException('Category not found');
      }
      brand.category = updateBrandDto.category as any;
    }

    if (imageUrl) {
      if (brand.image) {
        this.deleteFile(brand.image);
      }
      brand.image = imageUrl.replace(/\\/g, '/');
    }

    if (updateBrandDto.description !== undefined) {
      brand.description = updateBrandDto.description;
    }

    if (userId) {
      brand.updatedBy = userId as any;
    }

    const updated = await brand.save();
    await this.invalidateBrandCache();
    return updated;
  }

  async findAllBrands(query: FilterBrandDto) {
    const { search, category, page = 1, limit = 10 } = query;
    const cacheKey = `brands:list:${search || ''}:${category || ''}:${page}:${limit}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
        // Fall back to database
      }
    }

    const filter: any = { deletedAt: null };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;
    const [brands, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .populate('category', 'name slug image')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.brandModel.countDocuments(filter),
    ]);

    const result = {
      brands,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, result, 600);
      } catch {
      }
    }

    return result;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID');
    }

    const cacheKey = `brands:id:${id}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const brand = await this.brandModel
      .findOne({ _id: id, deletedAt: null })
      .populate('category', 'name slug image')
      .populate('products')
      .populate('createdBy', 'name email')
      .exec();

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, brand, 600);
      } catch {
      }
    }

    return brand;
  }

  async deleteBrand(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID');
    }

    const brand = await this.brandModel.findOne({ _id: id, deletedAt: null });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (brand.image) {
      this.deleteFile(brand.image);
      brand.image = undefined;
    }

    brand.deletedAt = new Date();
    brand.deletedBy = userId as any;

    await brand.save();
    await this.invalidateBrandCache();
    return { success: true, message: 'Brand deleted successfully' };
  }

  private deleteFile(filePath: string) {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.error(`Failed to delete file at ${filePath}:`, error);
    }
  }
}

