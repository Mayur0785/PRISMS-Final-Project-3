import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'PRICE_ALERT'
  | 'MARKET_SIGNAL'
  | 'WEATHER_ALERT'
  | 'SPOILAGE_ALERT'
  | 'BUYER_MATCH'
  | 'OFFER_RECEIVED'
  | 'COUNTER_OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'DELIVERY_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'LOGISTICS_ALERT'
  | 'PAYMENT_ALERT'
  | 'GRIEVANCE_UPDATE';

export type NotificationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface INotification extends Document {
  notificationId: string;
  userId: any;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  relatedCrop?: string;
  relatedMarket?: string;
  relatedLotId?: any;
  relatedOfferId?: any;
  counterPrice?: number;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    type: {
      type: String,
      enum: [
        'PRICE_ALERT',
        'MARKET_SIGNAL',
        'WEATHER_ALERT',
        'SPOILAGE_ALERT',
        'BUYER_MATCH',
        'OFFER_RECEIVED',
        'COUNTER_OFFER',
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'DELIVERY_UPDATE',
        'PAYMENT_UPDATE',
        'LOGISTICS_ALERT',
        'PAYMENT_ALERT',
        'GRIEVANCE_UPDATE',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    relatedCrop: { type: String },
    relatedMarket: { type: String },
    relatedLotId: { type: Schema.Types.Mixed },
    relatedOfferId: { type: Schema.Types.Mixed },
    counterPrice: { type: Number },
    isRead: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.recipientUserId = ret.userId;
        ret.offerId = ret.relatedOfferId;
        ret.lotId = ret.relatedLotId;
        ret.read = ret.isRead;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.recipientUserId = ret.userId;
        ret.offerId = ret.relatedOfferId;
        ret.lotId = ret.relatedLotId;
        ret.read = ret.isRead;
        return ret;
      }
    }
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

