import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { categoryRoles } from './category.endpoints.js';
import { multerCloudFunction } from '@services/multerCloud.js';
import { allowedExtensions } from '@utils/allowedExtensions.js';
import { validate } from '@middlewares/validation.js';
import { createCategorySchema, deleteCategorySchema, updateCategorySchema } from './category.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.post(
  '/',
  isAuth(categoryRoles.createCategory),
  multerCloudFunction(allowedExtensions.Image).single('image'),
  validate(createCategorySchema),
  categoryController.createCategory,
);
router.put(
  '/',
  isAuth(categoryRoles.updateCategory),
  multerCloudFunction(allowedExtensions.Image).single('image'),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
router.delete(
  '/',
  isAuth(categoryRoles.deleteCategory),
  validate(deleteCategorySchema),
  categoryController.deleteCategory,
);

export default router;
