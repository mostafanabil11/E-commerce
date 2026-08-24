import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';

describe('Category, Brand & Product Linked E2E Tests', () => {
  let app: INestApplication;
  let jwtToken: string;
  const mockUserId = new Types.ObjectId().toString();

  let createdCategoryId: string;
  let createdBrandId: string;
  let createdProductId: string;
  let brandlessProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const jwtService = app.get(JwtService);
    jwtToken = jwtService.sign(
      { id: mockUserId, role: 'USER' },
      { secret: 'super_secret_jwt_key_change_in_production' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Category Creation', () => {
    it('POST /category - should create Electronics category', async () => {
      const res = await request(app.getHttpServer())
        .post('/category')
        .set('Authorization', `Bearer ${jwtToken}`)
        .field('name', `Electronics ${Date.now()}`)
        .field('description', 'Electronic gadgets category')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.category._id).toBeDefined();
      createdCategoryId = res.body.category._id;
    });
  });

  describe('2. Brand Creation under Category', () => {
    it('POST /brand - should create Apple brand linked to Electronics category', async () => {
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('Authorization', `Bearer ${jwtToken}`)
        .field('name', `Apple ${Date.now()}`)
        .field('description', 'Apple Inc.')
        .field('category', createdCategoryId)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.brand._id).toBeDefined();
      expect(res.body.brand.category).toBe(createdCategoryId);
      createdBrandId = res.body.brand._id;
    });

    it('GET /brand - should list brand with populated category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/brand?category=${createdCategoryId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.brands.length).toBeGreaterThan(0);
      expect(res.body.brands[0].category).toBeDefined();
    });

    it('GET /brand/:id - should get brand with populated details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/brand/${createdBrandId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.brand._id).toBe(createdBrandId);
      expect(res.body.brand.category._id).toBe(createdCategoryId);
    });
  });

  describe('3. Product Creation under Category & Brand', () => {
    it('POST /product - should create iPhone 17 linked to Electronics & Apple', async () => {
      const res = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${jwtToken}`)
        .field('name', `iPhone 17 Pro ${Date.now()}`)
        .field('description', 'Latest flagship smartphone')
        .field('price', 1199.99)
        .field('discount', 5)
        .field('stock', 100)
        .field('category', createdCategoryId)
        .field('brand', createdBrandId)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.product._id).toBeDefined();
      expect(res.body.product.category).toBe(createdCategoryId);
      expect(res.body.product.brand).toBe(createdBrandId);
      createdProductId = res.body.product._id;
    });

    it('POST /product - should create brandless product (no brand provided)', async () => {
      const res = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${jwtToken}`)
        .field('name', `Generic USB Cable ${Date.now()}`)
        .field('description', 'Unbranded USB C Cable')
        .field('price', 9.99)
        .field('stock', 500)
        .field('category', createdCategoryId)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.product._id).toBeDefined();
      expect(res.body.product.category).toBe(createdCategoryId);
      expect(res.body.product.brand).toBeUndefined();
      brandlessProductId = res.body.product._id;
    });

    it('GET /product/:id - should find product with populated category & brand', async () => {
      const res = await request(app.getHttpServer())
        .get(`/product/${createdProductId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.product._id).toBe(createdProductId);
      expect(res.body.product.category._id).toBe(createdCategoryId);
      expect(res.body.product.brand._id).toBe(createdBrandId);
    });

    it('GET /category/:id - should show category with populated brands & products', async () => {
      const res = await request(app.getHttpServer())
        .get(`/category/${createdCategoryId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.category._id).toBe(createdCategoryId);
    });
  });

  describe('4. Deletion Cleanups', () => {
    it('DELETE /product/:id - should delete products', async () => {
      await request(app.getHttpServer())
        .delete(`/product/${createdProductId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/product/${brandlessProductId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('DELETE /brand/:id - should delete brand', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/brand/${createdBrandId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /category/:id - should delete category', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
