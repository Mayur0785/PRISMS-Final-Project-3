import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getBuyers,
  getBuyerById,
  searchBuyers,
  getBuyerDemands,
  createBuyerDemand,
  getBuyerDemandById,
} from './buyer.controller';

export const buyerRouter = Router();
export const buyerDemandRouter = Router();

buyerRouter.get('/', getBuyers);
buyerRouter.get('/search', searchBuyers);
buyerRouter.get('/:id', getBuyerById);

buyerDemandRouter.get('/', getBuyerDemands);
buyerDemandRouter.post('/', requireAuth, createBuyerDemand);
buyerDemandRouter.get('/:id', getBuyerDemandById);
