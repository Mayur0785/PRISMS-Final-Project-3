import { Router } from 'express';
import {
  getStorageRecommendation,
  getSaleWindowRecommendation,
  getRiskScore,
  getRecommendationExplanation,
} from './intelligence.controller';

export const intelligenceRouter = Router();

intelligenceRouter.get('/storage-recommendation', getStorageRecommendation);
intelligenceRouter.get('/sale-window', getSaleWindowRecommendation);
intelligenceRouter.get('/risk-score', getRiskScore);
intelligenceRouter.get('/explanation', getRecommendationExplanation);
