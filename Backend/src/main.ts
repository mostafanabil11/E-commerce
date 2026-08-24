import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { setupCors } from './common/utils/cors.config';
import { AbsoluteUrlInterceptor } from './common/interceptors/absolute-url.interceptor';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Stripe signs the exact bytes it sent, so the raw payload must survive
    // JSON parsing for webhook verification to succeed.
    rawBody: true,
  });
  
  setupCors(app);

  // The frontend calls /api/v1/*. Health and root stay unprefixed for probes.
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Expand stored `/uploads/...` paths into absolute URLs for clients.
  app.useGlobalInterceptors(new AbsoluteUrlInterceptor(app.get(ConfigService)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-Commerce REST API')
    .setDescription('Production-ready NestJS E-Commerce Backend API with Stripe, Paymob, Refunds, and Email Notifications')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 5005;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API base URL: http://localhost:${port}/api/v1`);
  console.log(`Swagger API Docs available at http://localhost:${port}/api/docs`);
  console.log(`Health Check available at http://localhost:${port}/health`);
}
void bootstrap();

