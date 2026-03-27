import Redis from 'ioredis';
import { env } from './env';
import { log } from '@/utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      log.error({ event: 'redis.error', err }, 'Redis client error');
    });

    redis.on('connect', () => {
      log.info({ event: 'redis.connect' }, 'Redis connected');
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
