import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@types-app/index.js';

interface GenerateTokenOptions {
  payload: Record<string, unknown>;
  signature: string;
  expiresIn?: string | number;
}

interface VerifyTokenOptions {
  token: string;
  signature: string;
}

export const generateToken = ({ payload, signature, expiresIn = '1d' }: GenerateTokenOptions): string => {
  if (!Object.keys(payload).length) {
    throw new Error('Token payload cannot be empty');
  }
  return jwt.sign(payload, signature, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = <T = TokenPayload>({ token, signature }: VerifyTokenOptions): T => {
  if (!token) throw new Error('Token is required');
  return jwt.verify(token, signature) as T;
};
