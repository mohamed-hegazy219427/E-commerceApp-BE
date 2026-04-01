import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '@middlewares/validation.js';
import * as authValSchema from './auth.validationSchemas.js';
import { loginLimiter, registerLimiter, forgetPasswordLimiter } from '@middlewares/rateLimiter.js';

const router = Router();

router.post('/', registerLimiter, validate(authValSchema.signUpSchema), authController.signUp);
router.get('/confirm/:token', validate(authValSchema.confirmEmailSchema), authController.confirmEmail);
router.post('/login', loginLimiter, validate(authValSchema.logInSchema), authController.logIn);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forget', forgetPasswordLimiter, validate(authValSchema.forgetPasswordSchema), authController.forgetPassword);
router.post('/reset/:token', validate(authValSchema.resetPasswordSchema), authController.resetPassword);
router.post('/loginWithGoogle', loginLimiter, authController.loginWithGoogle);

export default router;
