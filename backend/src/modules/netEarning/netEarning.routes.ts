import { Router } from 'express';
import { calculateNetEarning } from './netEarning.controller';
import { validate } from '../../middleware/validate';
import { calculateNetEarningSchema } from './netEarning.schema';

export const netEarningRouter = Router();

netEarningRouter.post('/', validate(calculateNetEarningSchema), calculateNetEarning);
