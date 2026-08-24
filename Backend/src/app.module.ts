import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EmailModule } from './common/email/email.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { ReviewModule } from './review/review.module';
import { CouponModule } from './coupon/coupon.module';
import { RedisModule } from './common/redis/redis.module';
import { OrderModule } from './order/order.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Local development reads config/dev.env; hosted environments (Render,
      // etc.) inject real environment variables and have no such file.
      envFilePath: resolve('./config/dev.env'),
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('Connected to MongoDB');
          });
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    EmailModule,
    UserModule,
    CategoryModule,
    BrandModule,
    ProductModule,
    CartModule,
    ReviewModule,
    CouponModule,
    OrderModule,
    WishlistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
