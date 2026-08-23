import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getPrices, triggerPriceSync } from './price.controller';
import { validate } from '../../middleware/validate';
import { getPricesSchema } from './price.schema';
import { requireAuth } from '../../middleware/requireAuth';

export const priceRouter = Router();

// Rate limiter for sync endpoint to prevent consuming Data.gov.in quota
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 sync requests per 15 min window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Data.gov.in sync rate limit exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/v1/prices - Public read prices
priceRouter.get('/', validate(getPricesSchema), getPrices);

// POST /api/v1/prices/sync - Protected admin/service endpoint for live ingestion
priceRouter.post('/sync', syncLimiter, requireAuth, triggerPriceSync);
