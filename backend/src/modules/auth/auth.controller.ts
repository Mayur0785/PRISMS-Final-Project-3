import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.model';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt';
import { env } from '../../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'An account with this mobile number or email already exists. Please switch to Sign In.',
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash, name, role });
    
    const accessToken = signAccess(user._id.toString());
    const refreshToken = signRefresh(user._id.toString());

    // Hash refresh token before storing
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save();

    res.cookie('refresh', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ success: true, data: { accessToken, refreshToken, user: { _id: user._id, email: user.email, name: user.name, role: user.role } } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }

    const accessToken = signAccess(user._id.toString());
    const refreshToken = signRefresh(user._id.toString());

    // Hash refresh token before storing
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save();

    res.cookie('refresh', refreshToken, COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: { accessToken, refreshToken, user: { _id: user._id, email: user.email, name: user.name, role: user.role } } });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      req.cookies?.refresh ||
      req.body?.refreshToken ||
      (req.headers['x-refresh-token'] as string) ||
      (req.headers?.cookie ? req.headers.cookie.split('refresh=')[1]?.split(';')[0] : undefined);

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    }

    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded._id);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
       // Breach detected, revoke all
       user.refreshToken = undefined;
       await user.save();
       return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token breach detected' } });
    }

    const newAccessToken = signAccess(user._id.toString());
    const newRefreshToken = signRefresh(user._id.toString());

    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
    await user.save();

    res.cookie('refresh', newRefreshToken, COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid token' } });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie('refresh');
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
