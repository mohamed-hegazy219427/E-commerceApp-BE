import { compareSync } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { customAlphabet } from 'nanoid';
import otpGenerator from 'otp-generator';
import { generateToken, verifyToken } from '@utils/tokenFunctions.js';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import { env } from '@config/env.js';
import { systemRoles } from '@utils/systemRoles.js';
import type { Result } from '@utils/result.js';
import type { IUserDocument } from '@models/user.model.js';
import type { IRefreshTokenDocument } from '@models/refreshToken.model.js';
import type { Types } from 'mongoose';
import { userRepository, refreshTokenRepository } from '../repositories/auth.repository.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export const REFRESH_TOKEN_DAYS = 7;

export interface IssuedTokens {
  accessToken: string;
  refreshTokenRaw: string;
}

export interface SignUpData {
  userName: string;
  email: string;
  password: string;
  address?: unknown[];
  gender?: string;
  age?: number;
  phoneNumber: string;
  role?: string;
  confirmationLink: string;
}

export interface GoogleAuthData {
  idToken: string;
}

class AuthService {
  /** Issues a new access + refresh token pair and persists the refresh token. */
  async issueTokens(userId: string, email: string, role: string): Promise<IssuedTokens> {
    const accessToken = generateToken({
      payload: { _id: userId, email, role },
      signature: env.SIGN_IN_TOKEN_SECRET as string,
      expiresIn: '15m',
    });
    const refreshTokenRaw = generateToken({
      payload: { _id: userId },
      signature: env.REFRESH_TOKEN_SECRET as string,
      expiresIn: `${REFRESH_TOKEN_DAYS}d`,
    });
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken({
      token: refreshTokenRaw,
      userId: userId as unknown as Types.ObjectId,
      expiresAt,
    });
    return { accessToken, refreshTokenRaw };
  }

  /** Generates a confirmation token for new signups. */
  generateConfirmationToken(email: string): string {
    return generateToken({
      payload: { email },
      signature: env.CONFIRMATION_EMAIL_TOKEN as string,
      expiresIn: '1h',
    });
  }

  /** Creates a new user. Caller must check email uniqueness first (or handle duplicate key error). */
  async createUser(data: {
    userName: string;
    email: string;
    password: string;
    address?: unknown[];
    gender?: string;
    age?: number;
    phoneNumber: string;
    role?: string;
  }): Promise<IUserDocument> {
    return userRepository.create(data);
  }

  /** Confirms a user's email from the token in the confirmation link. */
  async confirmEmail(token: string): Promise<Result<void>> {
    const tokenResult = verifyToken<{ email: string }>({
      token,
      signature: env.CONFIRMATION_EMAIL_TOKEN as string,
    });
    if (!tokenResult.ok) return tokenResult;

    const user = await userRepository.findByEmail(tokenResult.value.email);
    if (!user) return fail(new AppError('Invalid email', 400));
    if (user.isConfirmed) return fail(new AppError('Email already confirmed', 400));

    await user.updateOne({ isConfirmed: true });
    return ok(undefined);
  }

  /** Validates credentials and returns the user if valid. */
  async validateCredentials(email: string, password: string): Promise<Result<IUserDocument>> {
    const user = await userRepository.findByEmail(email);
    if (!user) return fail(new AppError('Invalid email or password', 400));
    if (!user.isConfirmed) return fail(new AppError('Email not confirmed. Check your inbox.', 400));
    if (!compareSync(password, user.password))
      return fail(new AppError('Invalid email or password', 400));
    return ok(user);
  }

  /** Refreshes an access token using a valid refresh token cookie value. */
  async refreshAccessToken(token: string): Promise<Result<string>> {
    const stored = await refreshTokenRepository.findActiveToken(token);
    if (!stored) return fail(new AppError('Invalid or expired session. Please log in.', 401));

    const decoded = verifyToken<{ _id: string }>({
      token,
      signature: env.REFRESH_TOKEN_SECRET as string,
    });
    if (!decoded.ok) return decoded;

    const user = await userRepository.findById(decoded.value._id);
    if (!user) return fail(new AppError('User not found. Please sign up.', 401));

    const accessToken = generateToken({
      payload: { _id: String(user._id), email: user.email, role: user.role },
      signature: env.SIGN_IN_TOKEN_SECRET as string,
      expiresIn: '15m',
    });
    return ok(accessToken);
  }

  /** Revokes the stored refresh token. */
  async revokeRefreshToken(token: string): Promise<void> {
    await refreshTokenRepository.revokeToken(token);
  }

  /** Generates a password reset OTP and a signed token containing it. */
  async initiatePasswordReset(email: string): Promise<Result<{ otp: string; resetToken: string }>> {
    const user = await userRepository.findByEmail(email);
    if (!user) return fail(new AppError('No account found for that email', 400));

    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const resetToken = generateToken({
      payload: { email, otp },
      expiresIn: '1h',
      signature: env.RESET_PASSWORD_SIGNATURE as string,
    });

    await user.updateOne({ forgetCode: otp });
    return ok({ otp, resetToken });
  }

  /** Validates OTP and resets the user's password. */
  async resetPassword(token: string, otp: string, newPassword: string): Promise<Result<void>> {
    const decoded = verifyToken<{ email: string; otp: string }>({
      token,
      signature: env.RESET_PASSWORD_SIGNATURE as string,
    });
    if (!decoded.ok) return decoded;
    if (otp !== decoded.value.otp) return fail(new AppError('Invalid OTP', 400));

    const user = await userRepository.findOne({
      email: decoded.value.email,
      forgetCode: otp,
    });
    if (!user) return fail(new AppError('OTP already used or password already reset', 400));

    user.password = newPassword;
    user.forgetCode = undefined;
    await user.save();
    return ok(undefined);
  }

  /** Authenticates or registers a user via Google OAuth. */
  async loginWithGoogle(idToken: string): Promise<Result<IUserDocument>> {
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified || !payload.email) {
      return fail(new AppError('Google account not verified', 400));
    }

    const { email, name } = payload;
    let user = await userRepository.findByEmail(email);

    if (!user) {
      user = await userRepository.create({
        userName: name ?? email.split('@')[0],
        email,
        password: nanoid(),
        provider: 'google',
        isConfirmed: true,
        phoneNumber: '0000000000',
        role: systemRoles.USER,
      });
    }

    await user.updateOne({ provider: 'google', status: 'Online' });
    return ok(user);
  }

  async setUserOnline(userId: string): Promise<void> {
    await userRepository.updateOneFilter({ _id: userId }, { status: 'Online' });
  }

  /** Returns an active refresh token record or null. */
  findActiveRefreshToken(token: string): Promise<IRefreshTokenDocument | null> {
    return refreshTokenRepository.findActiveToken(token);
  }
}

export const authService = new AuthService();
