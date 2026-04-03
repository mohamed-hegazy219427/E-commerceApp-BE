import { Router } from 'express';
import * as subCategoryController from './subCategory.controller.js';
import { subCategoryRoles } from './subCategory.endpoints.js';
import { multerCloudFunction } from '@services/multerCloud.js';
import { allowedExtensions } from '@utils/allowedExtensions.js';
import { validate } from '@middlewares/validation.js';
import {
  createSubCategorySchema,
  updateSubCategorySchema,
  deleteSubCategorySchema,
} from './subCategory.validationSchemas.js';
import { isAuth } from '@middlewares/auth.js';

const router = Router();

router.get('/', subCategoryController.getAllSubCategories);
router.post(
  '/',
  isAuth(subCategoryRoles.createSubCategory),
  multerCloudFunction(allowedExtensions.Image).single('image'),
  validate(createSubCategorySchema),
  subCategoryController.createSubCategory,
);
router.put(
  '/',
  isAuth(subCategoryRoles.updateSubCategory),
  multerCloudFunction(allowedExtensions.Image).single('image'),
  validate(updateSubCategorySchema),
  subCategoryController.updateSubCategory,
);
router.delete(
  '/',
  isAuth(subCategoryRoles.deleteSubCategory),
  validate(deleteSubCategorySchema),
  subCategoryController.deleteSubCategory,
);

export default router;
