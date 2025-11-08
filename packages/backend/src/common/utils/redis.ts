import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { LoggerService } from './logger';

/**
 * Redis service for NestJS
 * Manages Redis connection lifecycle with retry logic
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new LoggerService('RedisService');

  private client: RedisClientType | null = null;

  private readonly maxReconnectAttempts = 10;

  private readonly reconnectDelay = 1000; // Start with 1 second

  /**
   * Gets the Redis client instance
   */
  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  /**
   * Connects to Redis when the module is initialized
   */
  async onModuleInit() {
    await this.connect();
  }

  /**
   * Disconnects from Redis when the module is destroyed
   */
  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connects to Redis with retry logic
   */
  private async connect() {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              this.logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 1s, 2s, 4s, 8s, ...
            const delay = Math.min(this.reconnectDelay * 2 ** retries, 30000);
            this.logger.warn(
              `Reconnecting to Redis in ${delay}ms (attempt ${retries + 1})`
            );
            return delay;
          },
        },
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || '0', 10),
      });

      // Setup event listeners
      this.client.on('error', (error) => {
        this.logger.error(
          'Redis connection error',
          error instanceof Error ? error.stack : undefined
        );
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis reconnecting...');
      });

      this.client.on('end', () => {
        this.logger.log('Redis connection closed');
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error(
        'Failed to connect to Redis',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Disconnects from Redis
   */
  private async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis disconnected successfully');
      } catch (error) {
        this.logger.error(
          'Failed to disconnect from Redis',
          error instanceof Error ? error.stack : undefined
        );
      }
    }
  }

  /**
   * Checks if Redis is connected
   */
  async checkConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets a value from Redis
   */
  async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  /**
   * Sets a value in Redis with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.getClient().setEx(key, ttlSeconds, value);
    } else {
      await this.getClient().set(key, value);
    }
  }

  /**
   * Deletes a key from Redis
   */
  async del(key: string): Promise<number> {
    return this.getClient().del(key);
  }

  /**
   * Checks if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }
}
