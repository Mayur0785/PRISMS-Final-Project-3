import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schema';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

export { router as authRouter };
