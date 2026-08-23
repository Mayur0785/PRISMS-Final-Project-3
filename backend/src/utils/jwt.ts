import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const signAccess = (userId: string) => {
  return jwt.sign({ _id: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

export const signRefresh = (userId: string) => {
  return jwt.sign({ _id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

export const verifyAccess = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { _id: string };
};

export const verifyRefresh = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { _id: string };
};
