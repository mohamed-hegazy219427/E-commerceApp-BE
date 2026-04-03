import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import { env } from '@config/env.js';
import { authService, REFRESH_TOKEN_DAYS } from './services/auth.service.js';
import { sendEmailService } from '@services/sendEmailService.js';
import { emailTemplate } from '@utils/emailTemplate.js';
import type { TypedRequest } from '@types-app/index.js';
import type {
  SignUpBodyDTO,
  LoginBodyDTO,
  ConfirmEmailParamsDTO,
  ForgetPasswordBodyDTO,
  ResetPasswordBodyDTO,
  ResetPasswordParamsDTO,
  LoginWithGoogleBodyDTO,
} from './auth.validationSchemas.js';

//   Sign Up     ──
export const signUp = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<SignUpBodyDTO>;
  const { userName, email, password, address, gender, age, phoneNumber, role } = req.body;

  const confirmationToken = authService.generateConfirmationToken(email);
  const confirmationLink = `${req.protocol}://${req.headers.host}/api/v1/auth/confirm/${confirmationToken}`;

  const sent = await sendEmailService({
    to: email,
    subject: 'Confirm your email',
    message: emailTemplate({
      link: confirmationLink,
      linkData: 'Confirm Email',
      subject: 'Confirm your email',
    }),
  });
  if (!sent) return next(new AppError(req.t.auth.failConfirmEmail, 500));

  const user = await authService.createUser({
    userName,
    email,
    password,
    address: address as unknown[],
    gender,
    age,
    phoneNumber,
    role,
  });

  return sendSuccess(res, { userId: user._id }, req.t.auth.signupDone, 201);
});

//   Confirm Email
export const confirmEmail = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<
      Record<string, never>,
      Record<string, string>,
      ConfirmEmailParamsDTO
    >;

    const result = await authService.confirmEmail(req.params.token);
    if (!result.ok) return next(result.error);

    return sendSuccess(res, null, req.t.auth.confirmedDone);
  },
);

//   Login      ──
export const logIn = asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as TypedRequest<LoginBodyDTO>;
  const { email, password } = req.body;

  const validationResult = await authService.validateCredentials(email, password);
  if (!validationResult.ok) return next(validationResult.error);
  const user = validationResult.value;

  const { accessToken, refreshTokenRaw } = await authService.issueTokens(
    String(user._id),
    user.email,
    user.role,
  );
  await authService.setUserOnline(String(user._id));

  res.cookie('refreshToken', refreshTokenRaw, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, { accessToken }, req.t.auth.loginDone);
});

//   Refresh Token    ─
export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) return next(new AppError(req.t.auth.loginFirst, 401));

    const result = await authService.refreshAccessToken(token);
    if (!result.ok) return next(result.error);

    return sendSuccess(res, { accessToken: result.value }, req.t.auth.tokenRefreshed);
  },
);

//   Logout      ──
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) await authService.revokeRefreshToken(token);
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, req.t.auth.logoutDone);
});

//   Forget Password   ──
export const forgetPassword = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<ForgetPasswordBodyDTO>;

    const result = await authService.initiatePasswordReset(req.body.email);
    if (!result.ok) return next(result.error);
    const { resetToken } = result.value;

    const sent = await sendEmailService({
      to: req.body.email,
      subject: 'Reset your password',
      message: emailTemplate({ subject: 'Reset Password', otp: result.value.otp }),
    });
    if (!sent) return next(new AppError(req.t.auth.failSendResetEmail, 500));

    return sendSuccess(res, { resetPasswordToken: resetToken }, req.t.auth.checkEmail);
  },
);

//   Reset Password
export const resetPassword = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<
      ResetPasswordBodyDTO,
      Record<string, string>,
      ResetPasswordParamsDTO
    >;

    const result = await authService.resetPassword(
      req.params.token,
      req.body.otp,
      req.body.newPassword,
    );
    if (!result.ok) return next(result.error);

    return sendSuccess(res, null, req.t.auth.passwordResetSuccess);
  },
);

//   Login with Google
export const loginWithGoogle = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as TypedRequest<LoginWithGoogleBodyDTO>;

    const result = await authService.loginWithGoogle(req.body.idToken);
    if (!result.ok) return next(result.error);
    const user = result.value;

    const { accessToken, refreshTokenRaw } = await authService.issueTokens(
      String(user._id),
      user.email,
      user.role,
    );

    res.cookie('refreshToken', refreshTokenRaw, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, { accessToken }, req.t.auth.loginDone);
  },
);
