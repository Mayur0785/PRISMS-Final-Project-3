import { Request, Response, NextFunction } from 'express';
import { PriceAlert, AlertCondition } from './priceAlert.model';
import mongoose from 'mongoose';

async function generateAlertId(): Promise<string> {
  const count = await PriceAlert.countDocuments();
  const hex = (count + 301).toString(16).toUpperCase().padStart(4, '0');
  return `ALT-2026-${hex}`;
}

export const createPriceAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { commodity, marketId, marketName, targetPrice, condition } = req.body;

    if (!commodity || !targetPrice) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Commodity and target price are required' },
      });
    }

    const alertId = await generateAlertId();

    const alert = await PriceAlert.create({
      alertId,
      userId,
      commodity,
      marketId: marketId || 'vashi',
      marketName: marketName || 'Vashi APMC',
      targetPrice: Number(targetPrice),
      condition: (condition as AlertCondition) || 'PRICE_AT_OR_ABOVE',
      isEnabled: true,
    });

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserPriceAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const alerts = await PriceAlert.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePriceAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    const { targetPrice, isEnabled, condition, marketName } = req.body;

    const updateFields: any = {};
    if (targetPrice !== undefined) updateFields.targetPrice = Number(targetPrice);
    if (isEnabled !== undefined) updateFields.isEnabled = Boolean(isEnabled);
    if (condition !== undefined) updateFields.condition = condition;
    if (marketName !== undefined) updateFields.marketName = marketName;

    const alert = await PriceAlert.findOneAndUpdate(
      {
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { alertId: id }],
        userId,
      },
      { $set: updateFields },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALERT_NOT_FOUND', message: 'Price alert not found or unauthorized' },
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePriceAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const alert = await PriceAlert.findOneAndDelete({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { alertId: id }],
      userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALERT_NOT_FOUND', message: 'Price alert not found or unauthorized' },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Price alert deleted successfully', alertId: alert.alertId },
    });
  } catch (err) {
    next(err);
  }
};
