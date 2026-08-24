import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
  ) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  getHealthStatus() {
    return {
      status: 'ok',
      message: 'E-Commerce API is healthy and running',
      timestamp: new Date().toISOString(),
    };
  }
}
