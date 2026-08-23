import { Request, Response, NextFunction } from 'express';
import { Lot } from './lot.model';
import { computeBuyerMatchesForLot } from './matching.service';
import mongoose from 'mongoose';

// Generate human readable Lot ID: LOT-2026-XXXX
async function generateLotId(): Promise<string> {
  const count = await Lot.countDocuments();
  const hex = (count + 101).toString(16).toUpperCase().padStart(4, '0');
  return `LOT-2026-${hex}`;
}

export const getUserLots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const lots = await Lot.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (err) {
    next(err);
  }
};

export const createLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const {
      cropBatchId,
      cropName,
      variety,
      grade,
      quantityQtl,
      qualityScore,
      origin,
      district,
      targetMarket,
      expectedPricePerQtl,
      minimumAcceptablePrice,
      buyerVisibility,
      lotStatus,
      notes,
    } = req.body;

    if (!quantityQtl || quantityQtl <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUANTITY', message: 'Lot quantity must be greater than 0.' },
      });
    }

    const lotId = await generateLotId();

    const lot = await Lot.create({
      lotId,
      userId,
      cropBatchId: (cropBatchId && mongoose.isValidObjectId(cropBatchId)) ? (new mongoose.Types.ObjectId(cropBatchId) as any) : undefined,
      cropName,
      variety: variety || 'Standard',
      grade: grade || 'Grade A',
      quantityQtl,
      qualityScore: qualityScore || 85,
      origin: origin || 'Farm Gate',
      district: district || 'Nashik',
      targetMarket,
      expectedPricePerQtl,
      minimumAcceptablePrice: minimumAcceptablePrice || Math.round(expectedPricePerQtl * 0.9),
      buyerVisibility: buyerVisibility || 'MATCHED_BUYERS_ONLY',
      lotStatus: lotStatus || 'PUBLISHED',
      notes,
    });

    res.status(201).json({
      success: true,
      data: lot,
    });
  } catch (err) {
    next(err);
  }
};

export const getLotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const lot = await Lot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { lotId: id }],
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found.' },
      });
    }

    // Scoped Authorization Check: User A cannot access User B's lot if private
    if (lot.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this trade lot.' },
      });
    }

    res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (err) {
    next(err);
  }
};

export const updateLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const lot = await Lot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { lotId: id }],
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found.' },
      });
    }

    if (lot.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this trade lot.' },
      });
    }

    Object.assign(lot, req.body);
    await lot.save();

    res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const lot = await Lot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { lotId: id }],
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found.' },
      });
    }

    if (lot.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this trade lot.' },
      });
    }

    await lot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trade lot deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getMatchesForLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const lot = await Lot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { lotId: id }],
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found.' },
      });
    }

    if (lot.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access matches for this trade lot.' },
      });
    }

    const comparativeDecision = await computeBuyerMatchesForLot(lot);

    res.status(200).json({
      success: true,
      data: comparativeDecision,
    });
  } catch (err) {
    next(err);
  }
};
