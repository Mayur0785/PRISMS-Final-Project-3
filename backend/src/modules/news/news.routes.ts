import { Router } from 'express';
import { getLiveNewsFeed } from './news.controller';

export const newsRouter = Router();

newsRouter.get('/feed', getLiveNewsFeed);
