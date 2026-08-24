import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserDeliveries,
  createDeliveryOrder,
  updateDeliveryStatus,
  advanceDemoDelivery,
} from './delivery.controller';

export const deliveryRouter = Router();

deliveryRouter.use(requireAuth);

deliveryRouter.get('/', getUserDeliveries);
deliveryRouter.post('/', createDeliveryOrder);
deliveryRouter.patch('/:id/status', updateDeliveryStatus);
deliveryRouter.post('/:id/advance-demo', advanceDemoDelivery);
