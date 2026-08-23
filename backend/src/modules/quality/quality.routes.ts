import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getQualityQuestions,
  createQualityAssessment,
  getQualityAssessmentById,
  getUserAssessments,
} from './quality.controller';

export const qualityRouter = Router();

// Crop Questions Configuration
qualityRouter.get('/quality/crops/:crop/questions', requireAuth, getQualityQuestions);

// Quality Assessments
qualityRouter.post('/quality/assessments', requireAuth, createQualityAssessment);
qualityRouter.get('/quality/assessments/:id', requireAuth, getQualityAssessmentById);
qualityRouter.get('/quality/assessments', requireAuth, getUserAssessments);

// Legacy routes compatibility
qualityRouter.post('/quality', requireAuth, createQualityAssessment);
qualityRouter.get('/quality', requireAuth, getUserAssessments);
