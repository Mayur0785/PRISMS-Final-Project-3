import { Router } from 'express';
import { getMe, updateProfile } from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateProfile);

export { router as userRouter };
