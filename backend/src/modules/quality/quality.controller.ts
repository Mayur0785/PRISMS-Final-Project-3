import { Request, Response, NextFunction } from 'express';
import { QualityAssessment, QualityGrade, AssessmentMethod } from './quality.model';
import mongoose from 'mongoose';

async function generateAssessmentId(): Promise<string> {
  const count = await QualityAssessment.countDocuments();
  const hex = (count + 101).toString(16).toUpperCase().padStart(4, '0');
  return `QLT-2026-${hex}`;
}

export function calculateDeterministicGrade(score: number): QualityGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function evaluateCropQuality(data: {
  cropName: string;
  sizeScore?: number;
  colorScore?: number;
  firmnessScore?: number;
  moisturePercent?: number;
  visibleDamagePercent?: number;
  decayPercent?: number;
  cleanlinessScore?: number;
}): { overallScore: number; estimatedGrade: QualityGrade; qualityNotes: string } {
  const crop = data.cropName.toLowerCase();

  const size = Math.min(100, Math.max(0, data.sizeScore ?? 80));
  const color = Math.min(100, Math.max(0, data.colorScore ?? 80));
  const firmness = Math.min(100, Math.max(0, data.firmnessScore ?? 80));
  const damage = Math.min(100, Math.max(0, data.visibleDamagePercent ?? 2));
  const decay = Math.min(100, Math.max(0, data.decayPercent ?? 0));
  const cleanliness = Math.min(100, Math.max(0, data.cleanlinessScore ?? 85));
  const moisture = data.moisturePercent ?? 12;

  let overallScore = 80;
  let notes = '';

  if (crop.includes('onion')) {
    // Moisture penalty for onion if > 14%
    const moistureScore = moisture <= 14 ? 95 : Math.max(40, 95 - (moisture - 14) * 8);
    const damagePenalty = Math.max(0, 100 - (damage * 2 + decay * 4));
    overallScore = Math.round(0.3 * size + 0.25 * firmness + 0.2 * color + 0.15 * moistureScore + 0.1 * damagePenalty);
    notes = `Onion Assessment: Bulb firmness ${firmness}/100, Size ${size}/100, Moisture ${moisture}%, Damage ${damage}%.`;
  } else if (crop.includes('tomato')) {
    const damagePenalty = Math.max(0, 100 - (damage * 2.5 + decay * 5));
    overallScore = Math.round(0.3 * firmness + 0.25 * color + 0.2 * size + 0.25 * damagePenalty);
    notes = `Tomato Assessment: Firmness ${firmness}/100, Color/Ripeness ${color}/100, Damage ${damage}%.`;
  } else if (crop.includes('wheat')) {
    const moistureScore = moisture <= 12 ? 95 : Math.max(50, 95 - (moisture - 12) * 10);
    overallScore = Math.round(0.35 * cleanliness + 0.35 * moistureScore + 0.3 * firmness);
    notes = `Wheat Assessment: Grain cleanliness ${cleanliness}/100, Moisture ${moisture}%.`;
  } else if (crop.includes('banana')) {
    const damagePenalty = Math.max(0, 100 - (damage * 3 + decay * 4));
    overallScore = Math.round(0.35 * firmness + 0.25 * color + 0.2 * size + 0.2 * damagePenalty);
    notes = `Banana Assessment: Hands firmness ${firmness}/100, Color maturity ${color}/100.`;
  } else {
    const damagePenalty = Math.max(0, 100 - (damage * 2 + decay * 3));
    overallScore = Math.round(0.4 * firmness + 0.3 * size + 0.3 * damagePenalty);
    notes = `General Estimated Assessment for ${data.cropName}: Standard parameters evaluated.`;
  }

  const estimatedGrade = calculateDeterministicGrade(overallScore);
  return { overallScore, estimatedGrade, qualityNotes: notes };
}

export const createQualityAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { cropName, variety, sizeScore, colorScore, firmnessScore, moisturePercent, visibleDamagePercent, decayPercent, cleanlinessScore, cropBatchId, lotId, assessmentMethod } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Crop name is required' },
      });
    }

    const { overallScore, estimatedGrade, qualityNotes } = evaluateCropQuality({
      cropName,
      sizeScore,
      colorScore,
      firmnessScore,
      moisturePercent,
      visibleDamagePercent,
      decayPercent,
      cleanlinessScore,
    });

    const assessmentId = await generateAssessmentId();

    const assessment = await QualityAssessment.create({
      assessmentId,
      userId,
      cropBatchId: cropBatchId || undefined,
      lotId: lotId || undefined,
      cropName,
      variety: variety || 'Standard',
      sizeScore,
      colorScore,
      firmnessScore,
      moisturePercent,
      visibleDamagePercent,
      decayPercent,
      cleanlinessScore,
      overallScore,
      estimatedGrade,
      qualityNotes,
      assessmentMethod: assessmentMethod || 'RULE_BASED',
    });

    res.status(201).json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserAssessments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const assessments = await QualityAssessment.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (err) {
    next(err);
  }
};
