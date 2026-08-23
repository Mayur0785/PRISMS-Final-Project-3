import { Router } from 'express';
import { getMarkets, getRankedMarketsHandler } from './market.controller';
import { validate } from '../../middleware/validate';
import { getMarketsSchema } from './market.schema';

export const marketRouter = Router();

marketRouter.get('/', validate(getMarketsSchema), getMarkets);
marketRouter.get('/ranked', getRankedMarketsHandler);
marketRouter.post('/ranked', getRankedMarketsHandler);
