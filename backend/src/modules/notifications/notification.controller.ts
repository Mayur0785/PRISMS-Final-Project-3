import { Request, Response, NextFunction } from 'express';
import { Notification, NotificationType, NotificationSeverity } from './notification.model';
import mongoose from 'mongoose';

export async function generateNotificationId(): Promise<string> {
  const count = await Notification.countDocuments();
  const hex = (count + 501).toString(16).toUpperCase().padStart(4, '0');
  return `NTF-2026-${hex}`;
}

export async function sendSystemNotification(params: {
  userId: any;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  relatedCrop?: string;
  relatedMarket?: string;
  relatedLotId?: any;
  relatedOfferId?: any;
}) {
  try {
    const notificationId = await generateNotificationId();
    return await Notification.create({
      notificationId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      severity: params.severity || 'MEDIUM',
      relatedCrop: params.relatedCrop,
      relatedMarket: params.relatedMarket,
      relatedLotId: params.relatedLotId,
      relatedOfferId: params.relatedOfferId,
      isRead: false,
    });
  } catch (err) {
    console.warn('Error creating system notification:', err);
    return null;
  }
}

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const { type, title, message, severity, relatedCrop, relatedMarket, relatedLotId, relatedOfferId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Type, title, and message are required' },
      });
    }

    const notificationId = await generateNotificationId();

    const notification = await Notification.create({
      notificationId,
      userId: rawUserId,
      type: type as NotificationType,
      title,
      message,
      severity: (severity as NotificationSeverity) || 'MEDIUM',
      relatedCrop,
      relatedMarket,
      relatedLotId: relatedLotId || undefined,
      relatedOfferId: relatedOfferId || undefined,
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
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userEmail = (req as any).user.email;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const queryConditions: any[] = [
      { userId: rawUserId },
      { userId: userIdObj },
      { userId: String(rawUserId) }
    ];
    if (userEmail) {
      queryConditions.push({ userId: userEmail });
    }

    const notifications = await Notification.find({
      $or: queryConditions,
    }).sort({ createdAt: -1 });

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
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userEmail = (req as any).user.email;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const userQuery: any[] = [
      { userId: rawUserId },
      { userId: userIdObj },
      { userId: String(rawUserId) }
    ];
    if (userEmail) {
      userQuery.push({ userId: userEmail });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { notificationId: id }],
        $and: [{ $or: userQuery }],
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
