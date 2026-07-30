import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (error: Error) => {
      this.logger.error('Redis client error', error.stack);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.close();
  }

  async setWithExpiration(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, value, {
      expiration: {
        type: 'EX',
        value: ttlSeconds,
      },
    });
  }

  async getValue(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async getTimeToLive(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async deleteKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  async setIfAbsentWithExpiration(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, {
      expiration: {
        type: 'EX',
        value: ttlSeconds,
      },
      condition: 'NX',
    });
    return result === 'OK';
  }
}
