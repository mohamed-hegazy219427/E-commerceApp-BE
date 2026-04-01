import { scheduleJob } from 'node-schedule';
import { couponModel } from '@models/coupon.model.js';
import { logger } from '@services/logger.js';

/**
 * Runs every hour. Marks coupons whose toDate has passed as Expired using a
 * single bulkWrite instead of a per-document loop.
 */
export const changeCouponStatusCron = (): void => {
  scheduleJob('0 * * * *', async () => {
    logger.info('Running changeCouponStatusCron...');
    try {
      const result = await couponModel.updateMany(
        { couponStatus: 'Valid', toDate: { $lt: new Date() } },
        { $set: { couponStatus: 'Expired' } },
      );
      logger.info(`Cron: marked ${result.modifiedCount} coupons as Expired`);
    } catch (err) {
      logger.error('changeCouponStatusCron failed', { error: err });
    }
  });
};
