import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { Category, CategoryDocument } from '../DB/Models/category.model';
import { Brand, BrandDocument } from '../DB/Models/brand.model';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './product.dto';
import { RedisService } from '../common/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Brand.name)
    private readonly brandModel: Model<BrandDocument>,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  private async invalidateProductCache() {
    if (this.redisService) {
      try {
        await this.redisService.delByPattern('products:*');
      } catch {
      }
    }
  }

  async createProduct(
    createProductDto: CreateProductDto,
    imagePaths: string[],
    userId: string,
  ) {
    const existingProduct = await this.productModel.findOne({
      name: createProductDto.title.trim(),
    });
    if (existingProduct) {
      this.deleteFiles(imagePaths);
      throw new BadRequestException('Product with this name already exists');
    }

    if (!Types.ObjectId.isValid(createProductDto.category)) {
      this.deleteFiles(imagePaths);
      throw new BadRequestException('Invalid category ID');
    }
    const categoryExists = await this.categoryModel.findOne({
      _id: createProductDto.category,
      deletedAt: null,
    });
    if (!categoryExists) {
      this.deleteFiles(imagePaths);
      throw new NotFoundException('Category not found');
    }

    if (createProductDto.subcategory) {
      if (!Types.ObjectId.isValid(createProductDto.subcategory)) {
        this.deleteFiles(imagePaths);
        throw new BadRequestException('Invalid subcategory ID');
      }
      const subcategoryExists = await this.categoryModel.findOne({
        _id: createProductDto.subcategory,
        deletedAt: null,
      });
      if (!subcategoryExists) {
        this.deleteFiles(imagePaths);
        throw new NotFoundException('SubCategory not found');
      }
    }

    if (createProductDto.brand) {
      if (!Types.ObjectId.isValid(createProductDto.brand)) {
        this.deleteFiles(imagePaths);
        throw new BadRequestException('Invalid brand ID');
      }
      const brandExists = await this.brandModel.findOne({
        _id: createProductDto.brand,
        deletedAt: null,
      });
      if (!brandExists) {
        this.deleteFiles(imagePaths);
        throw new NotFoundException('Brand not found');
      }
      if (brandExists.category && brandExists.category.toString() !== categoryExists._id.toString()) {
        this.deleteFiles(imagePaths);
        throw new BadRequestException('The selected brand does not belong to the selected category');
      }
    }

    const slug = createProductDto.title.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedImages = imagePaths.map((p) => p.replace(/\\/g, '/'));

    const newProduct = new this.productModel({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
      slug,
      images: normalizedImages,
      createdBy: userId,
    });

    const saved = await newProduct.save();
    await this.invalidateProductCache();
    return saved;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    newImagePaths?: string[],
    userId?: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      if (newImagePaths) this.deleteFiles(newImagePaths);
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findOne({ _id: id, deletedAt: null });
    if (!product) {
      if (newImagePaths) this.deleteFiles(newImagePaths);
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.title) {
      const existingProduct = await this.productModel.findOne({
        name: updateProductDto.title.trim(),
        _id: { $ne: id },
      });
      if (existingProduct) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new BadRequestException('Product with this name already exists');
      }
      product.title = updateProductDto.title.trim();
      product.slug = updateProductDto.title.toLowerCase().trim().replace(/\s+/g, '-');
    }

    const targetCategory = updateProductDto.category || product.category;

    if (updateProductDto.category) {
      if (!Types.ObjectId.isValid(updateProductDto.category)) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new BadRequestException('Invalid category ID');
      }
      const categoryExists = await this.categoryModel.findOne({
        _id: updateProductDto.category,
        deletedAt: null,
      });
      if (!categoryExists) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new NotFoundException('Category not found');
      }
      product.category = updateProductDto.category as any;
    }

    if (updateProductDto.subcategory) {
      if (!Types.ObjectId.isValid(updateProductDto.subcategory)) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new BadRequestException('Invalid subcategory ID');
      }
      const subcategoryExists = await this.categoryModel.findOne({
        _id: updateProductDto.subcategory,
        deletedAt: null,
      });
      if (!subcategoryExists) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new NotFoundException('SubCategory not found');
      }
      product.subcategory = updateProductDto.subcategory as any;
    }

    if (updateProductDto.brand) {
      if (!Types.ObjectId.isValid(updateProductDto.brand)) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new BadRequestException('Invalid brand ID');
      }
      const brandExists = await this.brandModel.findOne({
        _id: updateProductDto.brand,
        deletedAt: null,
      });
      if (!brandExists) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new NotFoundException('Brand not found');
      }
      if (brandExists.category && brandExists.category.toString() !== targetCategory.toString()) {
        if (newImagePaths) this.deleteFiles(newImagePaths);
        throw new BadRequestException('The selected brand does not belong to the selected category');
      }
      product.brand = updateProductDto.brand as any;
    }

    if (newImagePaths && newImagePaths.length > 0) {
      if (product.images && product.images.length > 0) {
        this.deleteFiles(product.images);
      }
      product.images = newImagePaths.map((p) => p.replace(/\\/g, '/'));
    }

    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }

    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }

    if (updateProductDto.discount !== undefined) {
      product.discount = updateProductDto.discount;
    }

    if (updateProductDto.quantity !== undefined) {
      product.quantity = updateProductDto.quantity;
    }

    if (updateProductDto.isActive !== undefined) {
      product.isActive = updateProductDto.isActive;
    }

    if (userId) {
      product.updatedBy = userId as any;
    }

    const updated = await product.save();
    await this.invalidateProductCache();
    return updated;
  }

  async findAllProducts(query: FilterProductDto) {
    const { search, category, subcategory, brand, minPrice, maxPrice, sort, page = 1, limit = 100 } = query;
    const cacheKey = `products:list:${search || ''}:${category || ''}:${subcategory || ''}:${brand || ''}:${minPrice || ''}:${maxPrice || ''}:${sort || ''}:${page}:${limit}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const filter: any = { deletedAt: null };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    if (subcategory && Types.ObjectId.isValid(subcategory)) {
      filter.subcategory = subcategory;
    }

    if (brand && Types.ObjectId.isValid(brand)) {
      filter.brand = brand;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const sortOptions: any = {};
    if (sort === 'price_asc') {
      sortOptions.price = 1;
    } else if (sort === 'price_desc') {
      sortOptions.price = -1;
    } else if (sort === 'oldest') {
      sortOptions.createdAt = 1;
    } else if (sort === 'name_asc' || sort === 'title_asc') {
      sortOptions.title = 1;
    } else if (sort === 'name_desc' || sort === 'title_desc') {
      sortOptions.title = -1;
    } else if (sort === 'rating_desc') {
      sortOptions.ratingsAverage = -1;
    } else if (sort === 'sold_desc') {
      sortOptions.sold = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug image')
        .populate('subcategory', 'name slug')
        .populate('brand', 'name slug image')
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    const result = {
      products,
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
      throw new BadRequestException('Invalid product ID');
    }

    const cacheKey = `products:id:${id}`;

    if (this.redisService) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) return cached;
      } catch {
      }
    }

    const product = await this.productModel
      .findOne({ _id: id, deletedAt: null })
      .populate('category', 'name slug image')
      .populate('subcategory', 'name slug')
      .populate('brand', 'name slug image')
      .populate('createdBy', 'name email')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, product, 600);
      } catch {
      }
    }

    return product;
  }

  async deleteProduct(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findOne({ _id: id, deletedAt: null });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.images && product.images.length > 0) {
      this.deleteFiles(product.images);
      product.images = [];
    }

    product.deletedAt = new Date();
    product.deletedBy = userId as any;
    product.isActive = false;

    await product.save();
    await this.invalidateProductCache();
    return { success: true, message: 'Product deleted successfully' };
  }

  private deleteFiles(filePaths: string[]) {
    for (const filePath of filePaths) {
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
}

