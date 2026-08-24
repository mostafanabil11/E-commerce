import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../DB/Models/category.model';
import { CreateCategoryDto, FilterCategoryDto, UpdateCategoryDto } from './category.dto';
import { RedisService } from '../common/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  private async invalidateCategoryCache() {
    if (this.redisService) {
      try {
        await this.redisService.delByPattern('categories:*');
      } catch {
        // Ignore cache deletion errors
      }
    }
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    imageUrl: string | undefined,
    userId: string,
  ) {
    const checkCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name.trim(),
    });
    if (checkCategory) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new BadRequestException('Category already exists');
    }

    if (createCategoryDto.parentCategory) {
      if (!Types.ObjectId.isValid(createCategoryDto.parentCategory)) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Invalid parent category ID');
      }
      const parent = await this.categoryModel.findById(createCategoryDto.parentCategory);
      if (!parent) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new NotFoundException('Parent category not found');
      }
    }

    const slug = createCategoryDto.name.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedImage = imageUrl ? imageUrl.replace(/\\/g, '/') : undefined;

    const newCategory = new this.categoryModel({
      ...createCategoryDto,
      slug,
      image: normalizedImage,
      createdBy: userId,
    });
    const saved = await newCategory.save();
    await this.invalidateCategoryCache();
    return saved;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    imageUrl?: string,
    userId?: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null });
    if (!category) {
      if (imageUrl) this.deleteFile(imageUrl);
      throw new NotFoundException('Category not found');
    }

    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name.trim(),
        _id: { $ne: id },
      });
      if (existingCategory) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Category name already exists');
      }
    }

    if (updateCategoryDto.parentCategory) {
      if (!Types.ObjectId.isValid(updateCategoryDto.parentCategory)) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Invalid parent category ID');
      }
      if (updateCategoryDto.parentCategory === id) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new BadRequestException('Category cannot be its own parent');
      }
      const parent = await this.categoryModel.findOne({
        _id: updateCategoryDto.parentCategory,
        deletedAt: null,
      });
      if (!parent) {
        if (imageUrl) this.deleteFile(imageUrl);
        throw new NotFoundException('Parent category not found');
      }
    }

    if (imageUrl) {
      if (category.image) {
        this.deleteFile(category.image);
      }
      category.image = imageUrl.replace(/\\/g, '/');
    }

    if (updateCategoryDto.name) {
      category.name = updateCategoryDto.name.trim();
      category.slug = updateCategoryDto.name.toLowerCase().trim().replace(/\s+/g, '-');
    }

    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }

    if (updateCategoryDto.parentCategory !== undefined) {
      category.parentCategory = updateCategoryDto.parentCategory as any;
    }

    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;
    }

    if (userId) {
      category.updatedBy = userId as any;
    }

    const updated = await category.save();
    await this.invalidateCategoryCache();
    return updated;
  }

  /**
   * Subcategories are Category documents with a `parentCategory`. `scope`
   * selects top-level categories, subcategories, or both.
   */
  async findAllCategories(
    query: FilterCategoryDto,
    scope: 'root' | 'sub' | 'all' = 'root',
  ) {
    const { search, page = 1, limit = 100 } = query;
    const cacheKey = `categories:list:${scope}:${search || ''}:${page}:${limit}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
        // Fall back to database
      }
    }

    const filter: any = { deletedAt: null };

    if (scope === 'root') {
      filter.parentCategory = null;
    } else if (scope === 'sub') {
      filter.parentCategory = { $ne: null };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    const result = {
      categories,
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
      throw new BadRequestException('Invalid category ID');
    }

    const cacheKey = `categories:id:${id}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const category = await this.categoryModel
      .findOne({ _id: id, deletedAt: null })
      .populate('parentCategory', 'name slug')
      .populate('subcategories')
      .populate('products')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, category, 600);
      } catch {
      }
    }

    return category;
  }

  async deleteCategory(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.image) {
      this.deleteFile(category.image);
      category.image = undefined;
    }

    category.deletedAt = new Date();
    category.deletedBy = userId as any;
    category.isActive = false;

    await category.save();
    await this.invalidateCategoryCache();
    return { success: true, message: 'Category deleted successfully' };
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

