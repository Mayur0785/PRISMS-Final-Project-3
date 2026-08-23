import { Router } from 'express';
import { chatWithAdvisor } from './advisor.controller';

export const advisorRouter = Router();

advisorRouter.post('/chat', chatWithAdvisor);
