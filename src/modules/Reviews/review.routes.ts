import { Router } from 'express';
import { isAuth } from '@middlewares/auth.js';
import { validate } from '@middlewares/validation.js';
import { reviewRoles } from './review.endpoints.js';
import * as reviewController from './review.controller.js';
import { addReviewSchema } from './review.validationSchemas.js';

const router = Router();

router.post('/', isAuth(reviewRoles.addReview), validate(addReviewSchema), reviewController.addReview);

export default router;
