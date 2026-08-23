import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getAllFpos,
  getFpoById,
  joinFpo,
  getFpoMembers,
  createHarvestPool,
  contributeToPool,
  getPools,
  getPoolTransportOptimization,
  getPoolMarketRecommendations,
} from './fpo.controller';

export const fpoRouter = Router();

// Public FPO list
fpoRouter.get('/fpos', getAllFpos);
fpoRouter.get('/fpos/:id', getFpoById);
fpoRouter.get('/fpos/:id/members', getFpoMembers);

// Authenticated FPO operations
fpoRouter.post('/fpos/:id/join', requireAuth, joinFpo);

// Pools
fpoRouter.get('/pools', getPools);
fpoRouter.post('/pools', requireAuth, createHarvestPool);
fpoRouter.post('/pools/:id/contribute', requireAuth, contributeToPool);
fpoRouter.get('/pools/:id/transport-optimization', getPoolTransportOptimization);
fpoRouter.get('/pools/:id/market-recommendations', getPoolMarketRecommendations);
