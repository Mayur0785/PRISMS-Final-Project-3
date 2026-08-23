import { Router } from 'express';
import { getDistanceMatrix } from './distance.controller';
import { validate } from '../../middleware/validate';
import { getDistanceMatrixSchema } from './distance.schema';

export const distanceRouter = Router();

distanceRouter.post('/', validate(getDistanceMatrixSchema), getDistanceMatrix);
