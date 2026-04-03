import { Router } from 'express';
import express from 'express';
import * as orderController from './order.controller.js';
import { orderRoles } from './order.endpoints.js';
import { validate } from '@middlewares/validation.js';
import {
  createOrderSchema,
  fromCartToOrderSchema,
  deliverOrderSchema,
  cancelOrderSchema,
} from './order.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.post(
  '/',
  isAuth(orderRoles.createOrder),
  validate(createOrderSchema),
  orderController.createOrder,
);
router.post(
  '/fromCart',
  isAuth(orderRoles.fromCartToOrder),
  validate(fromCartToOrderSchema),
  orderController.fromCartToOrder,
);

// Stripe webhook — raw body required for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), orderController.stripeWebhook);

router.patch(
  '/:orderId/cancel',
  isAuth(orderRoles.cancelOrder),
  validate(cancelOrderSchema),
  orderController.cancelOrder,
);
router.patch(
  '/:orderId/deliver',
  isAuth(orderRoles.deliverOrder),
  validate(deliverOrderSchema),
  orderController.deliverOrder,
);

export default router;
