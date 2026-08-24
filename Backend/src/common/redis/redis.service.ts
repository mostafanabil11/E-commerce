import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis is a cache, never a source of truth. If the server is unreachable the
 * app must keep serving requests, so every operation degrades to a miss rather
 * than throwing. Set REDIS_ENABLED=false to skip connecting entirely.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private available = false;
  private warned = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const enabled =
      String(this.configService.get('REDIS_ENABLED') ?? 'true').trim() !==
      'false';

    if (!enabled) {
      this.logger.warn('Redis disabled via REDIS_ENABLED=false; running without cache');
      return;
    }

    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = Number(this.configService.get<number>('REDIS_PORT') || 6379);

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      // Stop reconnecting after a few attempts so a missing Redis doesn't
      // flood the logs for the lifetime of the process.
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    });

    this.client.on('ready', () => {
      this.available = true;
      this.warned = false;
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    });

    this.client.on('end', () => {
      this.available = false;
    });

    this.client.on('error', (err) => {
      this.available = false;
      if (!this.warned) {
        this.warned = true;
        this.logger.warn(
          `Redis unavailable at ${host}:${port} (${err.message}); continuing without cache`,
        );
      }
    });

    this.client.connect().catch(() => {
      // The 'error' handler above already reported this.
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.logger.log('Disconnected from Redis');
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  getClient(): Redis | undefined {
    return this.client;
  }

  /** Runs `op` against Redis, falling back to `fallback` on any failure. */
  private async safe<T>(op: (client: Redis) => Promise<T>, fallback: T): Promise<T> {
    if (!this.client || !this.available) return fallback;
    try {
      return await op(this.client);
    } catch (err) {
      this.logger.debug(`Redis operation failed: ${(err as Error).message}`);
      return fallback;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    return this.safe(async (client) => {
      const data = await client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    }, null);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<'OK' | null> {
    return this.safe(async (client) => {
      const serialized =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (ttlSeconds && ttlSeconds > 0) {
        return await client.set(key, serialized, 'EX', ttlSeconds);
      }
      return await client.set(key, serialized);
    }, null);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.safe((client) => client.del(...keys), 0);
  }

  async delByPattern(pattern: string): Promise<number> {
    return this.safe(async (client) => {
      const stream = client.scanStream({ match: pattern, count: 100 });
      let deletedCount = 0;
      for await (const keys of stream as AsyncIterable<string[]>) {
        if (keys.length > 0) {
          deletedCount += await client.del(...keys);
        }
      }
      return deletedCount;
    }, 0);
  }

  async exists(key: string): Promise<boolean> {
    return this.safe(async (client) => (await client.exists(key)) > 0, false);
  }

  async flushall(): Promise<'OK' | null> {
    return this.safe((client) => client.flushall(), null);
  }
}
