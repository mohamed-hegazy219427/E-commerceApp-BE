import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  CONNECTION_DB_URL: z.string().min(1, 'CONNECTION_DB_URL is required'),

  // Auth
  SALT_ROUNDS: z.string().default('8'),
  SIGN_IN_TOKEN_SECRET: z.string().min(1, 'SIGN_IN_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  CONFIRMATION_EMAIL_TOKEN: z.string().min(1, 'CONFIRMATION_EMAIL_TOKEN is required'),
  RESET_PASSWORD_SIGNATURE: z.string().min(1, 'RESET_PASSWORD_SIGNATURE is required'),
  ORDER_TOKEN: z.string().min(1, 'ORDER_TOKEN is required'),
  DEFAULT_TOKEN_SIGNATURE: z.string().min(1, 'DEFAULT_TOKEN_SIGNATURE is required'),
  BEARER_TOKEN_KEY: z.string().default('hegazy__'),

  // Email
  EMAIL: z.string().email('Invalid EMAIL format'),
  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:4200'),

  // Project folder name (Cloudinary root)
  PROJECT_FOLDER: z.string().default('E-commerceApp'),

  // Social links (optional)
  FACEBOOK_LINK: z.string().optional(),
  INSTAGRAM_LINK: z.string().optional(),
  TWITTER_LINK: z.string().optional(),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌  Invalid environment variables:\n');
  _parsed.error.issues.forEach((issue) => {
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nFix the above variables in config/config.env and restart.\n');
  process.exit(1);
}

export const env = {
  ..._parsed.data,
  PORT: parseInt(_parsed.data.PORT, 10),
  SALT_ROUNDS: parseInt(_parsed.data.SALT_ROUNDS, 10),
  isProd: _parsed.data.NODE_ENV === 'production',
  isDev: _parsed.data.NODE_ENV === 'development',
};

export type Env = typeof env;
