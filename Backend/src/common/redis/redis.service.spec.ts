import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
  let service: RedisService;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_HOST') return 'localhost';
              if (key === 'REDIS_PORT') return 6379;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    (service as any).client = mockRedisClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return parsed JSON object when cached data is JSON', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get('test_key');
      expect(result).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test_key');
    });

    it('should return string when data is simple string', async () => {
      mockRedisClient.get.mockResolvedValue('simple_string');

      const result = await service.get('test_key');
      expect(result).toEqual('simple_string');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set key without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('key', { data: 'test' });
      expect(result).toBe('OK');
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should set key with TTL when ttlSeconds is provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('key', 'value', 300);
      expect(result).toBe('OK');
      expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value', 'EX', 300);
    });
  });

  describe('del', () => {
    it('should delete specified key(s)', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del('key1');
      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1');
    });
  });
});
