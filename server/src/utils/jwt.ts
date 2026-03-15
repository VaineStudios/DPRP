import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthPayload } from '../types/index.js';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const signToken = (payload: AuthPayload): string => {
  return jwt.sign({ ...payload }, getSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '30d') as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, getSecret());
  return decoded as AuthPayload;
};
