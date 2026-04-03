import { Router } from 'express';
import * as brandController from './brand.controller.js';
import { brandRoles } from './brand.endpoints.js';
import { multerCloudFunction } from '@services/multerCloud.js';
import { allowedExtensions } from '@utils/allowedExtensions.js';
import { validate } from '@middlewares/validation.js';
import {
  addBrandSchema,
  updateBrandSchema,
  deleteBrandSchema,
  getBrandsByCategorySchema,
  getBrandsBySubCategorySchema,
} from './brand.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.post(
  '/',
  isAuth(brandRoles.addBrand),
  multerCloudFunction(allowedExtensions.Image).single('logo'),
  validate(addBrandSchema),
  brandController.addBrand,
);
router.put(
  '/',
  isAuth(brandRoles.updateBrand),
  multerCloudFunction(allowedExtensions.Image).single('logo'),
  validate(updateBrandSchema),
  brandController.updateBrand,
);
router.delete(
  '/',
  isAuth(brandRoles.deleteBrand),
  validate(deleteBrandSchema),
  brandController.deleteBrand,
);
router.get(
  '/byCategory',
  validate(getBrandsByCategorySchema),
  brandController.getBrandsByCategoryId,
);
router.get(
  '/bySubCategory',
  validate(getBrandsBySubCategorySchema),
  brandController.getBrandsBySubCategoryId,
);

export default router;
