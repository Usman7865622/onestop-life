import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Env } from '../config/env.validation';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super(config.get('REDIS_URL', { infer: true }), { maxRetriesPerRequest: 3 });
  }
  async onModuleDestroy() {
    await this.quit();
  }
}
