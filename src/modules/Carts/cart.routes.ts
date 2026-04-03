import { Router } from 'express';
import * as cartController from './cart.controller.js';
import { cartRoles } from './cart.endpoints.js';
import { validate } from '@middlewares/validation.js';
import { addToCartSchema, deleteFromCartSchema } from './cart.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.post('/', isAuth(cartRoles.addToCart), validate(addToCartSchema), cartController.addToCart);
router.delete(
  '/',
  isAuth(cartRoles.deleteFromCart),
  validate(deleteFromCartSchema),
  cartController.deleteFromCart,
);
router.delete('/clear', isAuth(cartRoles.clearCart), cartController.clearCart);

export default router;
