import { userModel } from '@models/user.model.js';
import { refreshTokenModel } from '@models/refreshToken.model.js';
import { sendEmailService } from '@services/sendEmailService.js';
import { emailTemplate } from '@utils/emailTemplate.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { generateToken, verifyToken } from '@utils/tokenFunctions.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';
import { env } from '@config/env.js';
import { systemRoles } from '@utils/systemRoles.js';
import { compareSync } from 'bcrypt';
import otpGenerator from 'otp-generator';
import { OAuth2Client } from 'google-auth-library';
import { customAlphabet } from 'nanoid';
import type { Request, Response, NextFunction } from 'express';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

const REFRESH_TOKEN_DAYS = 7;

const issueTokens = async (userId: string, email: string, role: string) => {
  const accessToken = generateToken({
    payload: { _id: userId, email, role },
    signature: env.SIGN_IN_TOKEN_SECRET,
    expiresIn: '15m',
  });
  const refreshTokenRaw = generateToken({
    payload: { _id: userId },
    signature: env.REFRESH_TOKEN_SECRET,
    expiresIn: `${REFRESH_TOKEN_DAYS}d`,
  });
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await refreshTokenModel.create({ token: refreshTokenRaw, userId, expiresAt });
  return { accessToken, refreshTokenRaw };
};

// ─── Sign Up ────────────────────────────────────────────────────────────────
export const signUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userName, email, password, address, gender, age, phoneNumber, role } = req.body as Record<string, string>;

  if (await userModel.findOne({ email })) {
    return next(new AppError(req.t.auth.emailExists, 409));
  }

  const token = generateToken({
    payload: { email },
    signature: env.CONFIRMATION_EMAIL_TOKEN,
    expiresIn: '1h',
  });

  const confirmationLink = `${req.protocol}://${req.headers.host}/api/v1/auth/confirm/${token}`;
  const sent = await sendEmailService({
    to: email,
    subject: 'Confirm your email',
    message: emailTemplate({ link: confirmationLink, linkData: 'Confirm Email', subject: 'Confirm your email' }),
  });

  if (!sent) return next(new AppError(req.t.auth.failConfirmEmail, 500));

  const user = await userModel.create({ userName, email, password, address, gender, age, phoneNumber, role });

  return sendSuccess(res, { userId: user._id }, req.t.auth.signupDone, 201);
});

// ─── Confirm Email ───────────────────────────────────────────────────────────
export const confirmEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { email } = verifyToken<{ email: string }>({ token, signature: env.CONFIRMATION_EMAIL_TOKEN });

  const user = await userModel.findOne({ email });
  if (!user) return next(new AppError(req.t.auth.invalidEmail, 400));
  if (user.isConfirmed) return next(new AppError(req.t.auth.alreadyConfirmed, 400));

  await user.updateOne({ isConfirmed: true });
  return sendSuccess(res, null, req.t.auth.confirmedDone);
});

// ─── Login ───────────────────────────────────────────────────────────────────
export const logIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await userModel.findOne({ email });
  if (!user) return next(new AppError(req.t.auth.invalidEmail, 400));
  if (!user.isConfirmed) return next(new AppError(req.t.auth.notConfirmed, 400));
  if (!compareSync(password, user.password)) return next(new AppError(req.t.auth.invalidPassword, 400));

  const { accessToken, refreshTokenRaw } = await issueTokens(
    String(user._id), user.email, user.role,
  );

  await user.updateOne({ status: 'Online' });

  res.cookie('refreshToken', refreshTokenRaw, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, { accessToken }, req.t.auth.loginDone);
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) return next(new AppError(req.t.auth.loginFirst, 401));

  const stored = await refreshTokenModel.findOne({ token, isRevoked: false });
  if (!stored) return next(new AppError(req.t.auth.invalidToken, 401));

  const decoded = verifyToken<{ _id: string }>({ token, signature: env.REFRESH_TOKEN_SECRET });
  const user = await userModel.findById(decoded._id);
  if (!user) return next(new AppError(req.t.auth.pleaseSignup, 401));

  const accessToken = generateToken({
    payload: { _id: String(user._id), email: user.email, role: user.role },
    signature: env.SIGN_IN_TOKEN_SECRET,
    expiresIn: '15m',
  });

  return sendSuccess(res, { accessToken }, req.t.auth.tokenRefreshed);
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    await refreshTokenModel.findOneAndUpdate({ token }, { isRevoked: true });
  }
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, req.t.auth.logoutDone);
});

// ─── Forget Password ──────────────────────────────────────────────────────────
export const forgetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body as { email: string };
  const user = await userModel.findOne({ email });
  if (!user) return next(new AppError(req.t.auth.invalidEmail, 400));

  const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false });
  const token = generateToken({ payload: { email, otp }, expiresIn: '1h', signature: env.RESET_PASSWORD_SIGNATURE });

  const sent = await sendEmailService({
    to: email,
    subject: 'Reset your password',
    message: emailTemplate({ subject: 'Reset Password', otp }),
  });
  if (!sent) return next(new AppError(req.t.auth.failSendResetEmail, 500));

  await user.updateOne({ forgetCode: otp });
  return sendSuccess(res, { resetPasswordToken: token }, req.t.auth.checkEmail);
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { newPassword, otp } = req.body as { newPassword: string; otp: string };

  const decoded = verifyToken<{ email: string; otp: string }>({ token, signature: env.RESET_PASSWORD_SIGNATURE });
  if (otp !== decoded.otp) return next(new AppError(req.t.auth.invalidOtp, 400));

  const user = await userModel.findOne({ email: decoded.email, forgetCode: otp });
  if (!user) return next(new AppError(req.t.auth.alreadyResetPassword, 400));

  user.password = newPassword;
  user.forgetCode = undefined;
  await user.save();

  return sendSuccess(res, null, req.t.auth.passwordResetSuccess);
});

// ─── Login with Google ────────────────────────────────────────────────────────
export const loginWithGoogle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { idToken } = req.body as { idToken: string };
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email_verified || !payload.email) {
    return next(new AppError(req.t.auth.invalidEmail, 400));
  }

  const { email, name } = payload;
  let user = await userModel.findOne({ email });

  if (!user) {
    user = await userModel.create({
      userName: name ?? email.split('@')[0],
      email,
      password: nanoid(),
      provider: 'google',
      isConfirmed: true,
      phoneNumber: '0000000000',
      role: systemRoles.USER,
    });
  }

  const { accessToken, refreshTokenRaw } = await issueTokens(String(user._id), user.email, user.role);
  await user.updateOne({ provider: 'google', status: 'Online' });

  res.cookie('refreshToken', refreshTokenRaw, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, { accessToken }, req.t.auth.loginDone);
});
