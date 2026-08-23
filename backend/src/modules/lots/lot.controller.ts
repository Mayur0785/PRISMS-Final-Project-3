import { Request, Response, NextFunction } from 'express';
import { Lot } from './lot.model';
import { computeBuyerMatchesForLot } from './matching.service';
import mongoose from 'mongoose';

// Generate collision-safe human readable Lot ID: LOT-2026-XXXX
async function generateUniqueLotId(): Promise<string> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
    const candidate = `LOT-2026-${randomHex}`;

    const exists = await Lot.exists({ lotId: candidate });
    if (!exists) {
      return candidate;
    }
  }
  const nowHex = (Date.now() % 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `LOT-2026-${nowHex}`;
}

export const getUserLots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    if (!rawUserId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const lots = await Lot.find({
      $or: [
        { userId: rawUserId },
        { userId: userIdObj },
        { userId: String(rawUserId) }
      ]
    }).sort({ createdAt: -1 });

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
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User identity not found on request.' },
      });
    }

    const userId = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

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

    const numQuantity = Number(quantityQtl);
    const numExpectedPrice = Number(expectedPricePerQtl);
    const numMinPrice = Number(minimumAcceptablePrice) || Math.round(numExpectedPrice * 0.9);

    if (!numQuantity || numQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUANTITY', message: 'Lot quantity must be greater than 0.' },
      });
    }

    let createdLot = null;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      attempts++;
      const lotId = await generateUniqueLotId();

      try {
        createdLot = await Lot.create({
          lotId,
          userId,
          cropBatchId: (cropBatchId && mongoose.isValidObjectId(cropBatchId)) ? new mongoose.Types.ObjectId(cropBatchId) : (cropBatchId || undefined),
          cropName,
          variety: variety || 'Standard',
          grade: grade || 'Grade A',
          quantityQtl: numQuantity,
          qualityScore: Number(qualityScore) || 85,
          origin: origin || 'Farm Gate',
          district: district || 'Nashik',
          targetMarket,
          expectedPricePerQtl: numExpectedPrice,
          minimumAcceptablePrice: numMinPrice,
          buyerVisibility: buyerVisibility || 'MATCHED_BUYERS_ONLY',
          lotStatus: lotStatus || 'PUBLISHED',
          notes,
        });

        break;
      } catch (err: any) {
        if (err?.code === 11000 && err?.keyPattern?.lotId) {
          console.warn(`[Lot Creation Retry] Collision on lotId. Attempt ${attempts}/${maxRetries}...`);
          if (attempts >= maxRetries) {
            return res.status(500).json({
              success: false,
              error: {
                code: 'LOT_CREATION_FAILED',
                message: 'Unable to create a unique trade lot ID. Please try again.',
              },
            });
          }
          continue;
        }
        throw err;
      }
    }

    if (!createdLot) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOT_CREATION_FAILED',
          message: 'Unable to create a unique trade lot ID. Please try again.',
        },
      });
    }

    res.status(201).json({
      success: true,
      data: createdLot,
    });
  } catch (err) {
    console.error('Error creating trade lot on backend:', err);
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
