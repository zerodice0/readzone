import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, simple, colorize, printf } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const ts = new Date(timestamp as string).toLocaleTimeString();
  return `${ts} [${level}]: ${stack || message}`;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'readzone-api' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      simple(),
      consoleFormat
    ),
  }));
}

export { logger };