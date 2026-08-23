import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createLotSchema, updateLotSchema } from './lot.schema';
import {
  getUserLots,
  createLot,
  getLotById,
  updateLot,
  deleteLot,
  getMatchesForLot,
} from './lot.controller';

export const lotRouter = Router();

lotRouter.use(requireAuth); // Lock down all private Lot endpoints

lotRouter.get('/', getUserLots);
lotRouter.post('/', validate(createLotSchema), createLot);
lotRouter.get('/:id', getLotById);
lotRouter.patch('/:id', validate(updateLotSchema), updateLot);
lotRouter.delete('/:id', deleteLot);
lotRouter.get('/:id/matches', getMatchesForLot);
