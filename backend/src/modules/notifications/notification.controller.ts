import { Request, Response, NextFunction } from 'express';
import { Notification, NotificationType, NotificationSeverity } from './notification.model';
import mongoose from 'mongoose';

async function generateNotificationId(): Promise<string> {
  const count = await Notification.countDocuments();
  const hex = (count + 501).toString(16).toUpperCase().padStart(4, '0');
  return `NTF-2026-${hex}`;
}

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { type, title, message, severity, relatedCrop, relatedMarket, relatedLotId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Type, title, and message are required' },
      });
    }

    const notificationId = await generateNotificationId();

    const notification = await Notification.create({
      notificationId,
      userId,
      type: type as NotificationType,
      title,
      message,
      severity: (severity as NotificationSeverity) || 'MEDIUM',
      relatedCrop,
      relatedMarket,
      relatedLotId: relatedLotId || undefined,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { notificationId: id }],
        userId,
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found or unauthorized' },
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};
