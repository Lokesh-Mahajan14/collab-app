import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken);
}

/**
 * Safely retrieve a cached value from Redis.
 * Returns null on cache miss or if Redis is not configured / errors.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (error) {
    console.error(`[Redis] get error for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set a cached value in Redis with TTL in seconds.
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds = 60
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[Redis] set error for key "${key}":`, error);
  }
}

/**
 * Safely delete a cache entry from Redis.
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] del error for key "${key}":`, error);
  }
}
