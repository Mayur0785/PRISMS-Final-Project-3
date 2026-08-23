import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserPayments,
  getPaymentById,
  updatePaymentStatus,
} from './payment.controller';

export const paymentRouter = Router();

paymentRouter.use(requireAuth);

paymentRouter.get('/', getUserPayments);
paymentRouter.get('/:id', getPaymentById);
paymentRouter.patch('/:id/status', updatePaymentStatus);
