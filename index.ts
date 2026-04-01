import 'dotenv/config';
import path from 'path';
import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load env from config/config.env (keep the original path)
config({ path: path.resolve('./config/config.env') });

import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { createApp, startCronJobs } from './src/intiateApp.js';
import { logger } from './src/shared/services/logger.js';

async function bootstrap(): Promise<void> {
  // Connect to DB — fail fast if unavailable
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Start scheduled jobs
  startCronJobs();

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
