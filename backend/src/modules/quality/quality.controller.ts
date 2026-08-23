import { Request, Response, NextFunction } from 'express';
import { QualityAssessment } from './quality.model';
import { getQualityConfigForCrop } from './qualityConfig';
import { evaluateLotQuality, AnswerItem } from './quality.engine';
import mongoose from 'mongoose';

async function generateAssessmentId(): Promise<string> {
  const count = await QualityAssessment.countDocuments();
  const hex = (count + 101).toString(16).toUpperCase().padStart(4, '0');
  return `QPA-2026-${hex}`;
}

export const getQualityQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cropParam = req.params.crop as string;
    const config = getQualityConfigForCrop(cropParam || 'onion');

    res.status(200).json({
      success: true,
      data: {
        cropName: config.cropName,
        parameters: config.parameters,
        questions: config.questions,
        gradeRules: config.gradeRules,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createQualityAssessment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    const farmerId = String(rawUserId);

    const { cropName, variety, answers, cropBatchId, lotId } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Crop name is required' },
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ANSWERS', message: 'Answers must be an array of question responses' },
      });
    }

    // Evaluate answers using dynamic calculation engine
    const evaluation = evaluateLotQuality(cropName, answers as AnswerItem[]);

    const assessmentId = await generateAssessmentId();

    const assessment = await QualityAssessment.create({
      assessmentId,
      farmerId,
      cropBatchId: cropBatchId || undefined,
      lotId: lotId || undefined,
      cropName: evaluation.cropName,
      variety: variety || 'Garwa',
      answers,
      parameterScores: evaluation.parameterScores,
      qualityScore: evaluation.qualityScore,
      provisionalGrade: evaluation.provisionalGrade,
      evidenceConfidence: evaluation.evidenceConfidence,
      criticalFlags: evaluation.criticalFlags,
      positiveFactors: evaluation.positiveFactors,
      riskFactors: evaluation.riskFactors,
      passportSummary: evaluation.passportSummary,
      isProvisional: true,
    } as any);

    const assessmentObj = (assessment as any).toObject ? (assessment as any).toObject() : assessment;

    res.status(201).json({
      success: true,
      data: {
        ...assessmentObj,
        evaluation,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getQualityAssessmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const assessment = await QualityAssessment.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { assessmentId: id },
        { lotId: mongoose.isValidObjectId(id) ? id : null },
        { lotId: id },
      ],
    } as any);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: { code: 'ASSESSMENT_NOT_FOUND', message: 'Quality assessment not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserAssessments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const assessments = await QualityAssessment.find({
      $or: [{ farmerId: rawUserId }, { farmerId: userIdObj }, { farmerId: String(rawUserId) }],
    } as any).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (err) {
    next(err);
  }
};
