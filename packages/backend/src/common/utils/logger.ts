import pino from 'pino';

/**
 * Pino logger configuration with structured JSON output
 * Supports different log levels based on environment
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    pid: process.pid,
  },
});

/**
 * Creates a child logger with additional context
 * @param context - Context identifier (e.g., 'AuthService', 'UserController')
 * @returns Child logger with context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Logger service for NestJS dependency injection
 */
export class LoggerService {
  private readonly logger: pino.Logger;

  constructor(context?: string) {
    this.logger = context ? createLogger(context) : logger;
  }

  log(message: string, ...args: unknown[]) {
    this.logger.info({ args }, message);
  }

  error(message: string, trace?: string, ...args: unknown[]) {
    this.logger.error({ trace, args }, message);
  }

  warn(message: string, ...args: unknown[]) {
    this.logger.warn({ args }, message);
  }

  debug(message: string, ...args: unknown[]) {
    this.logger.debug({ args }, message);
  }

  verbose(message: string, ...args: unknown[]) {
    this.logger.trace({ args }, message);
  }

  fatal(message: string, ...args: unknown[]) {
    this.logger.fatal({ args }, message);
  }
}
