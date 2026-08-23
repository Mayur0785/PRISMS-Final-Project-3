import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { createQualityAssessment, getUserAssessments } from './quality.controller';

export const qualityRouter = Router();

qualityRouter.post('/quality', requireAuth, createQualityAssessment);
qualityRouter.get('/quality', requireAuth, getUserAssessments);
