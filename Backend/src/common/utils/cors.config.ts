import { INestApplication } from '@nestjs/common';

export function setupCors(app: INestApplication): void {
  const frontendUrl = process.env.FRONTEND_URL;

  app.enableCors({
    origin: frontendUrl
      ? [frontendUrl, 'http://localhost:3000', 'http://localhost:5173']
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'token', 'stripe-signature'],
  });
}
