import { z } from 'zod';

//   Secret branded type  ─
// Prevents secrets from being accidentally logged or serialized.
// Assign with: secret('raw_value')
// Usage: env.STRIPE_SECRET_KEY as string  (when you genuinely need the raw value)
//
type Secret = string & { readonly __brand: 'Secret' };
const secret = (s: string): Secret => s as Secret;

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

const _data = _parsed.data;

//   Parsed & frozen env object                ──
// Secrets use the branded Secret type to prevent accidental logging/serialization.
// Object.freeze prevents runtime mutation of config values.
//
export const env = Object.freeze({
  ..._data,
  PORT: parseInt(_data.PORT, 10),
  SALT_ROUNDS: parseInt(_data.SALT_ROUNDS, 10),
  isProd: _data.NODE_ENV === 'production',
  isDev: _data.NODE_ENV === 'development',
  // Branded secrets — not printable as plain strings
  SIGN_IN_TOKEN_SECRET: secret(_data.SIGN_IN_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: secret(_data.REFRESH_TOKEN_SECRET),
  CONFIRMATION_EMAIL_TOKEN: secret(_data.CONFIRMATION_EMAIL_TOKEN),
  RESET_PASSWORD_SIGNATURE: secret(_data.RESET_PASSWORD_SIGNATURE),
  ORDER_TOKEN: secret(_data.ORDER_TOKEN),
  DEFAULT_TOKEN_SIGNATURE: secret(_data.DEFAULT_TOKEN_SIGNATURE),
  STRIPE_SECRET_KEY: secret(_data.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: secret(_data.STRIPE_WEBHOOK_SECRET),
  CLOUDINARY_API_SECRET: secret(_data.CLOUDINARY_API_SECRET),
  EMAIL_PASSWORD: secret(_data.EMAIL_PASSWORD),
});

export type Env = typeof env;
