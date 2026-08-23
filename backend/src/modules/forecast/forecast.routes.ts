import { Router } from 'express';
import { getForecast } from './forecast.controller';
import { validate } from '../../middleware/validate';
import { getForecastSchema } from './forecast.schema';

export const forecastRouter = Router();

forecastRouter.get('/', validate(getForecastSchema), getForecast);
