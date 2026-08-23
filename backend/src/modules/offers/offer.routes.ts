import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserOffers,
  getOffersForLot,
  acceptOffer,
  rejectOffer,
  counterOffer,
  withdrawOffer,
} from './offer.controller';

export const offerRouter = Router();

offerRouter.use(requireAuth); // Enforce authentication and ownership

offerRouter.get('/', getUserOffers);
offerRouter.get('/lot/:lotId', getOffersForLot);
offerRouter.post('/:id/accept', acceptOffer);
offerRouter.post('/:id/reject', rejectOffer);
offerRouter.post('/:id/counter', counterOffer);
offerRouter.post('/:id/withdraw', withdrawOffer);
