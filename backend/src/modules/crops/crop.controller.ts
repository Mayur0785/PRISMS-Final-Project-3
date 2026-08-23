import { Request, Response, NextFunction } from 'express';
import { CropBatch } from './crop.model';
import { assertOwnership } from '../../utils/ownershipCheck';

export const getCrops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    
    // Strictly fetch only records owned by authenticated user
    const crops = await CropBatch.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: crops,
    });
  } catch (err) {
    next(err);
  }
};

export const createCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { cropName, variety, quantityKg, grade, targetMandi, status, estimatedRealization } = req.body;

    // Calculate net realization if not provided using PRISMS formula: Gross - Transport - Spoilage - APMC Cess
    let estVal = estimatedRealization;
    if (estVal === undefined || estVal === null) {
      const qtl = Number(quantityKg) / 100;
      let baseRate = 2400;
      const lower = String(cropName).toLowerCase();
      if (lower.includes('onion')) baseRate = 2350;
      else if (lower.includes('wheat')) baseRate = 2275;
      else if (lower.includes('tomato')) baseRate = 3100;
      else if (lower.includes('potato')) baseRate = 1950;
      else if (lower.includes('soybean')) baseRate = 4800;
      else if (lower.includes('cotton')) baseRate = 6900;

      const gross = baseRate * qtl;
      const transport = 45 * 1.5 * qtl;
      const spoilageRate = lower.includes('tomato') ? 0.12 : lower.includes('onion') ? 0.08 : lower.includes('wheat') ? 0.05 : 0.04;
      const spoilage = gross * spoilageRate;
      const cess = gross * 0.05;
      estVal = Math.round(gross - transport - spoilage - cess);
    }

    // Attach authenticated user ID as owner
    const crop = await CropBatch.create({
      userId: req.user._id,
      cropName,
      variety,
      quantityKg: Number(quantityKg),
      grade: grade || 'Grade 1',
      targetMandi: targetMandi || 'Vashi APMC',
      status: status || 'Standard',
      estimatedRealization: Math.max(0, Number(estVal)),
    });

    res.status(201).json({
      success: true,
      data: crop,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const cropId = String(req.params.id);

    // Enforce strict ownership - throws 404/NOT_FOUND if crop doesn't belong to req.user._id
    const crop = await assertOwnership(CropBatch, cropId, req.user._id as string);

    if (req.body.cropName !== undefined) crop.cropName = req.body.cropName;
    if (req.body.variety !== undefined) crop.variety = req.body.variety;
    if (req.body.quantityKg !== undefined) crop.quantityKg = Number(req.body.quantityKg);
    if (req.body.grade !== undefined) crop.grade = req.body.grade;
    if (req.body.targetMandi !== undefined) crop.targetMandi = req.body.targetMandi;
    if (req.body.status !== undefined) crop.status = req.body.status;
    if (req.body.estimatedRealization !== undefined) crop.estimatedRealization = Number(req.body.estimatedRealization);

    await crop.save();

    res.status(200).json({
      success: true,
      data: crop,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const cropId = String(req.params.id);

    // Enforce strict ownership - throws 404/NOT_FOUND if crop doesn't belong to req.user._id
    const crop = await assertOwnership(CropBatch, cropId, req.user._id as string);
    await crop.deleteOne();

    res.status(200).json({
      success: true,
      data: { message: 'Crop batch deleted successfully' },
    });
  } catch (err) {
    next(err);
  }
};
