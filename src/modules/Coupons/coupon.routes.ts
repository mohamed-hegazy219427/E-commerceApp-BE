import { Router } from 'express';
import * as couponController from './coupon.controller.js';
import { couponRoles } from './coupon.endpoints.js';
import { validate } from '@middlewares/validation.js';
import { addCouponSchema, deleteCouponSchema, assignUserSchema } from './coupon.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.post('/', isAuth(couponRoles.addCoupon), validate(addCouponSchema), couponController.addCoupon);
router.delete('/', isAuth(couponRoles.deleteCoupon), validate(deleteCouponSchema), couponController.deleteCoupon);
router.patch('/assign', isAuth(couponRoles.assignUserToCoupon), validate(assignUserSchema), couponController.assignUserToCoupon);

export default router;
