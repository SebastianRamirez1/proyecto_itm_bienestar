import Redis from 'ioredis';
import { env } from '../../config/env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

redis.on('connect', () => {
  console.info('[Redis] connected');
});

export const CacheTTL = {
  ALERTS: 60 * 5,       // 5 minutes
  CAFETERIA: 60 * 60 * 4, // 4 hours
  EVENTS: 60 * 60 * 12,   // 12 hours
  LIBRARY: 60 * 30,       // 30 minutes
  HEALTH: 60 * 60 * 24,   // 24 hours
} as const;

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<{ data: T; stale: boolean }> {
  const cached = await redis.get(key);

  if (cached) {
    return { data: JSON.parse(cached) as T, stale: false };
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return { data, stale: false };
}
