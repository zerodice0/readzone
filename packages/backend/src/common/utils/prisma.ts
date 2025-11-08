import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from './logger';

/**
 * Prisma service for NestJS
 * Manages database connection lifecycle and provides Prisma client
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new LoggerService('PrismaService');

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      errorFormat: 'pretty',
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query} (${e.duration}ms)`);
      });
    }

    // Log database errors
    this.$on('error' as never, (e: { message: string }) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    // Log database warnings
    this.$on('warn' as never, (e: { message: string }) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  /**
   * Connects to the database when the module is initialized
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error(
        'Failed to connect to database',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Disconnects from the database when the module is destroyed
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error(
        'Failed to disconnect from database',
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Checks if database is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
