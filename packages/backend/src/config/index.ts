import { z } from 'zod';

/**
 * Environment configuration schema with Zod validation
 * Validates all required environment variables at startup
 */
export const configSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('0'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Session
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('86400000'), // 24 hours

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Application URLs
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Validates and returns typed configuration
 * Throws error if validation fails
 */
export function validateConfig(): Config {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => err.path.join('.'))
        .join(', ');
      throw new Error(
        `Configuration validation failed. Missing or invalid environment variables: ${missingVars}\n` +
          `Please check your .env file and ensure all required variables are set correctly.`
      );
    }
    throw error;
  }
}

/**
 * Configuration factory for NestJS ConfigModule
 */
export const configFactory = () => validateConfig();
