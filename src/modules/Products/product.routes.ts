import { Router } from 'express';
import * as productController from './product.controller.js';
import { multerCloudFunction } from '@services/multerCloud.js';
import { allowedExtensions } from '@utils/allowedExtensions.js';
import { validate } from '@middlewares/validation.js';
import { addProductSchema, updateProductSchema } from './product.validationSchema.js';
import { isAuth } from '@middlewares/auth.js';
import { productRoles } from './product.endpoints.js';

const router = Router();

router.get('/', productController.getAllProducts);
router.get('/search', productController.getProductByTitle);
router.get('/list', productController.listProducts);

router.post(
  '/',
  isAuth(productRoles.addProduct),
  multerCloudFunction(allowedExtensions.Image).array('images', 5),
  validate(addProductSchema),
  productController.addProduct,
);
router.put(
  '/',
  isAuth(productRoles.updateProduct),
  multerCloudFunction(allowedExtensions.Image).array('images', 5),
  validate(updateProductSchema),
  productController.updateProduct,
);

export default router;
