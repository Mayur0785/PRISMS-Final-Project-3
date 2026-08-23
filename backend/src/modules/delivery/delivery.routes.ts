import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserDeliveries,
  createDeliveryOrder,
  updateDeliveryStatus,
} from './delivery.controller';

export const deliveryRouter = Router();

deliveryRouter.use(requireAuth);

deliveryRouter.get('/', getUserDeliveries);
deliveryRouter.post('/', createDeliveryOrder);
deliveryRouter.patch('/:id/status', updateDeliveryStatus);
