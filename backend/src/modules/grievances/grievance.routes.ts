import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getUserGrievances,
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
} from './grievance.controller';

export const grievanceRouter = Router();

grievanceRouter.use(requireAuth);

grievanceRouter.get('/', getUserGrievances);
grievanceRouter.post('/', createGrievance);
grievanceRouter.get('/:id', getGrievanceById);
grievanceRouter.patch('/:id/status', updateGrievanceStatus);
