import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from './redis';

/**
 * Redis storage implementation for @nestjs/throttler
 *
 * Stores rate limit data in Redis for distributed rate limiting
 * across multiple application instances.
 */
@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Increment the rate limit counter for a key
   *
   * @param key - Throttle key (e.g., "login:192.168.1.1")
   * @param ttl - Time to live in milliseconds
   * @param limit - Maximum number of requests allowed
   * @param blockDuration - Duration to block in milliseconds
   * @param throttlerName - Name of the throttler
   * @returns Throttler storage record
   */
  async increment(
    key: string,
    ttl: number,
    limit: number
  ): Promise<ThrottlerStorageRecord> {
    const client = this.redisService.getClient();
    const ttlSeconds = Math.ceil(ttl / 1000);

    // Use MULTI/EXEC for atomic operations
    const pipeline = client.multi();
    pipeline.incr(key);
    pipeline.pTTL(key);

    const results = await pipeline.exec();

    if (!results || results.length !== 2) {
      throw new Error('Failed to increment throttle counter');
    }

    const totalHits = results[0] as number;
    let timeToExpire = results[1] as number;

    // If key didn't have TTL (new key or no TTL set), set it
    if (timeToExpire === -1 || timeToExpire === -2) {
      await client.expire(key, ttlSeconds);
      timeToExpire = ttl;
    }

    // Check if limit is exceeded
    const isBlocked = totalHits > limit;
    const timeToBlockExpire = isBlocked ? timeToExpire : 0;

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
