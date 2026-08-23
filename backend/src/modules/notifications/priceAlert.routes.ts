import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  createPriceAlert,
  getUserPriceAlerts,
  updatePriceAlert,
  deletePriceAlert,
} from './priceAlert.controller';

export const priceAlertRouter = Router();

priceAlertRouter.post('/price-alerts', requireAuth, createPriceAlert);
priceAlertRouter.get('/price-alerts', requireAuth, getUserPriceAlerts);
priceAlertRouter.patch('/price-alerts/:id', requireAuth, updatePriceAlert);
priceAlertRouter.delete('/price-alerts/:id', requireAuth, deletePriceAlert);
