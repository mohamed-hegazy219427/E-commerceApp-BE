import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '@services/logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.CONNECTION_DB_URL);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err });
    throw err;
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});
