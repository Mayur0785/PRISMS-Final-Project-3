import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
} from './notification.controller';

export const notificationRouter = Router();

notificationRouter.post('/notifications', requireAuth, createNotification);
notificationRouter.get('/notifications', requireAuth, getUserNotifications);
notificationRouter.patch('/notifications/:id/read', requireAuth, markNotificationRead);
