import Redis from 'ioredis';
import { env } from '@config/env.js';
import { logger } from '@services/logger.js';

class CacheService {
  private client: Redis | null = null;

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 3,
        });

        this.client.on('connect', () => {
          logger.info('Redis connected successfully', { module: 'CacheService' });
        });

        this.client.on('error', (err: Error) => {
          logger.error('Redis connection error', {
            module: 'CacheService',
            error: err instanceof Error ? err.message : String(err),
          });
        });
      } catch (error) {
        logger.error('Failed to initialize Redis client', {
          module: 'CacheService',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logger.warn('REDIS_URL not provided. Caching will be disabled.', { module: 'CacheService' });
    }
  }

  /**
   * Get a value from the cache.
   * @param key The key to look for.
   * @returns The parsed value or null if not found/error.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Cache get error', {
        module: 'CacheService',
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set a value in the cache with a TTL.
   * @param key The key to set.
   * @param value The value to store (will be JSON stringified).
   * @param ttlSeconds Time-to-live in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      const stringifiedValue = JSON.stringify(value);
      await this.client.set(key, stringifiedValue, 'EX', ttlSeconds);
    } catch (error) {
      logger.error('Cache set error', {
        module: 'CacheService',
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete a value from the cache.
   * @param key The key to delete.
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache del error', {
        module: 'CacheService',
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Invalidate all keys starting with a specific prefix.
   * @param prefix The prefix to match.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.error('Cache invalidateByPrefix error', {
        module: 'CacheService',
        prefix,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const cacheService = new CacheService();
