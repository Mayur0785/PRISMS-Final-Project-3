import { Router } from 'express';
import {
  getBuyers,
  getBuyerById,
  searchBuyers,
  getBuyerDemands,
  getBuyerDemandById,
} from './buyer.controller';

export const buyerRouter = Router();
export const buyerDemandRouter = Router();

buyerRouter.get('/', getBuyers);
buyerRouter.get('/search', searchBuyers);
buyerRouter.get('/:id', getBuyerById);

buyerDemandRouter.get('/', getBuyerDemands);
buyerDemandRouter.get('/:id', getBuyerDemandById);
