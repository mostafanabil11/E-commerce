/**
 * Rebuilds the catalogue from the snapshot in `seed/raw/*.json` and the images
 * in `uploads/seed/`. Destructive: catalogue collections are dropped and
 * recreated. User accounts are preserved apart from the seeded demo accounts.
 *
 *   npm run seed
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';

import { AppModule } from '../app.module';
import { Product, ProductDocument } from '../DB/Models/product.model';
import { Category, CategoryDocument } from '../DB/Models/category.model';
import { Brand, BrandDocument } from '../DB/Models/brand.model';
import { Review, ReviewDocument } from '../DB/Models/review.model';
import { User, UserDocument } from '../DB/Models/user.model';
import { Cart, CartDocument } from '../DB/Models/cart.model';
import { Wishlist, WishlistDocument } from '../DB/Models/wishlist.model';
import { hash } from '../common/security/hash.security';
import { GenderEnum, ProviderEnum, RoleEnum } from '../common/enums';

const logger = new Logger('Seed');
const RAW = join(process.cwd(), 'seed', 'raw');

/** Max review documents generated per product, regardless of the source count. */
const MAX_REVIEWS_PER_PRODUCT = 10;

interface RawProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceAfterDiscount?: number;
  quantity: number;
  sold?: number;
  imageCover: string;
  images: string[];
  ratingsAverage?: number;
  ratingsQuantity?: number;
  category?: { _id: string };
  brand?: { _id: string };
  subcategory?: { _id: string }[];
}

interface RawCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  category?: string; // present on subcategories: the parent id
}

interface RawBrand {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

function readRaw<T>(file: string): T[] {
  return JSON.parse(readFileSync(join(RAW, `${file}.json`), 'utf8')) as T[];
}

/**
 * The snapshot references images on the origin host. They were downloaded into
 * `uploads/seed/<kind>/`, which the API serves at `/uploads/seed/<kind>/`.
 */
function localImage(
  url: string | undefined,
  kind: 'products' | 'categories' | 'brands',
): string | undefined {
  if (!url) return undefined;
  const file = url.split('/').pop();
  if (!file) return undefined;
  return `/uploads/seed/${kind}/${file}`;
}

/** Ratings that average out to `target` across `count` reviews. */
function ratingsFor(target: number, count: number): number[] {
  const ratings: number[] = [];
  let runningTotal = 0;
  for (let i = 0; i < count; i++) {
    const remaining = count - i;
    const ideal = (target * count - runningTotal) / remaining;
    const rating = Math.min(5, Math.max(1, Math.round(ideal)));
    ratings.push(rating);
    runningTotal += rating;
  }
  return ratings;
}

const DEMO_REVIEWERS = [
  'Ahmed Hassan',
  'Sara Ibrahim',
  'Omar Khaled',
  'Nour Mostafa',
  'Youssef Ali',
  'Mariam Fouad',
  'Karim Adel',
  'Hana Samir',
  'Tarek Mahmoud',
  'Laila Ashraf',
];

const COMMENTS = [
  'Exactly as described, arrived quickly.',
  'Great quality for the price.',
  'Works well, would buy again.',
  'Good value, packaging could be better.',
  'Very happy with this purchase.',
  'Does the job, no complaints.',
  'Better than I expected.',
  'Solid product, recommended.',
  'Decent, though delivery took a while.',
  'Excellent build quality.',
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
  const categoryModel = app.get<Model<CategoryDocument>>(getModelToken(Category.name));
  const brandModel = app.get<Model<BrandDocument>>(getModelToken(Brand.name));
  const reviewModel = app.get<Model<ReviewDocument>>(getModelToken(Review.name));
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const cartModel = app.get<Model<CartDocument>>(getModelToken(Cart.name));
  const wishlistModel = app.get<Model<WishlistDocument>>(getModelToken(Wishlist.name));

  try {
    logger.log('Clearing catalogue collections...');
    await Promise.all([
      productModel.deleteMany({}),
      categoryModel.deleteMany({}),
      brandModel.deleteMany({}),
      reviewModel.deleteMany({}),
      cartModel.deleteMany({}),
      wishlistModel.deleteMany({}),
    ]);

    // --- Admin -------------------------------------------------------------
    const adminEmail = (
      process.env.SEED_ADMIN_EMAIL || 'admin@novacart.dev'
    ).toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

    await userModel.deleteOne({ email: adminEmail });
    const admin = await userModel.create({
      name: 'Store Admin',
      email: adminEmail,
      password: await hash(adminPassword),
      role: RoleEnum.ADMIN,
      provider: ProviderEnum.SYSTEM,
      gender: GenderEnum.MALE,
      isVerified: true,
      confirmedAt: new Date(),
    });
    logger.log(`Admin ready: ${adminEmail}`);

    // --- Categories --------------------------------------------------------
    const rawCategories = readRaw<RawCategory>('categories');
    const categoryIdMap = new Map<string, Types.ObjectId>();

    for (const raw of rawCategories) {
      const doc = await categoryModel.create({
        name: raw.name,
        slug: raw.slug,
        image: localImage(raw.image, 'categories'),
        isActive: true,
        createdBy: admin._id,
      });
      categoryIdMap.set(raw._id, doc._id);
    }
    logger.log(`Categories: ${categoryIdMap.size}`);

    // --- Subcategories (categories with a parent) --------------------------
    const rawSubcategories = readRaw<RawCategory>('subcategories');
    let subCount = 0;

    for (const raw of rawSubcategories) {
      const parentId = raw.category ? categoryIdMap.get(raw.category) : undefined;
      if (!parentId) continue; // orphaned in the snapshot
      const doc = await categoryModel.create({
        name: raw.name,
        slug: raw.slug,
        parentCategory: parentId,
        isActive: true,
        createdBy: admin._id,
      });
      categoryIdMap.set(raw._id, doc._id);
      subCount++;
    }
    logger.log(`Subcategories: ${subCount}`);

    // --- Brands ------------------------------------------------------------
    const rawBrands = readRaw<RawBrand>('brands');
    const brandIdMap = new Map<string, Types.ObjectId>();

    for (const raw of rawBrands) {
      const doc = await brandModel.create({
        name: raw.name,
        slug: raw.slug,
        image: localImage(raw.image, 'brands'),
        createdBy: admin._id,
      });
      brandIdMap.set(raw._id, doc._id);
    }
    logger.log(`Brands: ${brandIdMap.size}`);

    // --- Demo reviewers ----------------------------------------------------
    const reviewerPassword = await hash('Reviewer@123');
    const reviewers: UserDocument[] = [];

    for (const [index, name] of DEMO_REVIEWERS.entries()) {
      const email = `reviewer${index + 1}@novacart.dev`;
      await userModel.deleteOne({ email });
      reviewers.push(
        await userModel.create({
          name,
          email,
          password: reviewerPassword,
          role: RoleEnum.USER,
          provider: ProviderEnum.SYSTEM,
          gender: index % 2 === 0 ? GenderEnum.MALE : GenderEnum.FEMALE,
          isVerified: true,
          confirmedAt: new Date(),
        }),
      );
    }
    logger.log(`Demo reviewers: ${reviewers.length}`);

    // --- Products + their reviews ------------------------------------------
    const rawProducts = readRaw<RawProduct>('products');
    let productCount = 0;
    let reviewCount = 0;

    // The snapshot reuses some slugs (five products share "woman-shawl"), but
    // the schema indexes slug as unique, so later collisions get a suffix.
    const usedSlugs = new Set<string>();
    const uniqueSlug = (slug: string) => {
      if (!usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        return slug;
      }
      let suffix = 2;
      while (usedSlugs.has(`${slug}-${suffix}`)) suffix++;
      const unique = `${slug}-${suffix}`;
      usedSlugs.add(unique);
      return unique;
    };

    for (const raw of rawProducts) {
      const categoryId = raw.category ? categoryIdMap.get(raw.category._id) : undefined;
      if (!categoryId) {
        logger.warn(`Skipping "${raw.title}": unknown category`);
        continue;
      }

      const subcategoryIds = (raw.subcategory || [])
        .map((sub) => categoryIdMap.get(sub._id))
        .filter((id): id is Types.ObjectId => Boolean(id));

      // The snapshot stores an absolute discounted price; the schema stores a percentage.
      const discount =
        raw.priceAfterDiscount && raw.priceAfterDiscount < raw.price
          ? Math.round(((raw.price - raw.priceAfterDiscount) / raw.price) * 100)
          : 0;

      const product = await productModel.create({
        title: raw.title,
        slug: uniqueSlug(raw.slug),
        description: raw.description,
        price: raw.price,
        discount,
        quantity: raw.quantity ?? 0,
        sold: raw.sold ?? 0,
        imageCover: localImage(raw.imageCover, 'products'),
        images: (raw.images || [])
          .map((img) => localImage(img, 'products'))
          .filter((img): img is string => Boolean(img)),
        category: categoryId,
        subcategory: subcategoryIds,
        brand: raw.brand ? brandIdMap.get(raw.brand._id) : undefined,
        isActive: true,
        createdBy: admin._id,
      });
      productCount++;

      // Ratings are derived from real Review documents so that the recompute
      // triggered by a future review stays consistent with what is displayed.
      const targetAverage = raw.ratingsAverage ?? 0;
      const wanted = Math.min(
        raw.ratingsQuantity ?? 0,
        MAX_REVIEWS_PER_PRODUCT,
        reviewers.length,
      );

      if (wanted > 0 && targetAverage > 0) {
        const ratings = ratingsFor(targetAverage, wanted);
        await reviewModel.insertMany(
          ratings.map((rating, i) => ({
            user: reviewers[i]._id,
            product: product._id,
            rating,
            comment: COMMENTS[i % COMMENTS.length],
            createdBy: reviewers[i]._id,
          })),
        );
        reviewCount += wanted;

        const total = ratings.reduce((sum, r) => sum + r, 0);
        product.ratingsAverage = Math.round((total / wanted) * 10) / 10;
        product.ratingsQuantity = wanted;
        await product.save();
      }
    }

    logger.log(`Products: ${productCount}`);
    logger.log(`Reviews: ${reviewCount}`);
    logger.log('Seed complete.');
  } catch (error) {
    logger.error(`Seed failed: ${(error as Error).message}`);
    logger.error((error as Error).stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
