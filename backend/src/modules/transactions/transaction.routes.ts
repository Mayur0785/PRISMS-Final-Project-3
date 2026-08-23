import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserTransactions,
  getTransactionById,
  getTransactionSummary,
} from './transaction.controller';

export const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.get('/', getUserTransactions);
transactionRouter.get('/:id', getTransactionById);
transactionRouter.get('/:id/summary', getTransactionSummary);
