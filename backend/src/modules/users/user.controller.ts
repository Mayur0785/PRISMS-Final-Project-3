import { Request, Response, NextFunction } from 'express';
import { assertOwnership } from '../../utils/ownershipCheck';
import { User } from './user.model';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        village: user.village,
        district: user.district,
        landholdingAcres: user.landholdingAcres,
        createdAt: user.createdAt,
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.village !== undefined) user.village = req.body.village;
    if (req.body.district !== undefined) user.district = req.body.district;
    if (req.body.landholdingAcres !== undefined) user.landholdingAcres = Number(req.body.landholdingAcres);

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        village: user.village,
        district: user.district,
        landholdingAcres: user.landholdingAcres,
        updatedAt: user.updatedAt,
      }
    });
  } catch (err) {
    next(err);
  }
};
