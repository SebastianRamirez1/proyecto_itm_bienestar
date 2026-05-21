import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  API_KEY_SALT_ROUNDS: z.coerce.number().default(10),

  RATE_LIMIT_MAX_ANONYMOUS: z.coerce.number().default(100),
  RATE_LIMIT_MAX_AUTHENTICATED: z.coerce.number().default(500),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  SCRAPER_TIMEOUT_MS: z.coerce.number().default(30000),

  // Optional: public URL of the deployed instance (e.g. https://itm-bienestar.up.railway.app)
  // Used to populate the OpenAPI server list and configure CORS in production.
  PUBLIC_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
