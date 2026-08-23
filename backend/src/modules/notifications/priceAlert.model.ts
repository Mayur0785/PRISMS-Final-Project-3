import mongoose, { Schema, Document } from 'mongoose';

export type AlertCondition = 'PRICE_AT_OR_ABOVE' | 'PRICE_AT_OR_BELOW';

export interface IPriceAlert extends Document {
  alertId: string;
  userId: Schema.Types.ObjectId;
  commodity: string;
  marketId?: string;
  marketName?: string;
  targetPrice: number;
  condition: AlertCondition;
  isEnabled: boolean;
  lastTriggeredAt?: Date;
  lastTriggeredRecordId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    commodity: { type: String, required: true, index: true },
    marketId: { type: String },
    marketName: { type: String },
    targetPrice: { type: Number, required: true },
    condition: {
      type: String,
      enum: ['PRICE_AT_OR_ABOVE', 'PRICE_AT_OR_BELOW'],
      default: 'PRICE_AT_OR_ABOVE',
    },
    isEnabled: { type: Boolean, default: true, index: true },
    lastTriggeredAt: { type: Date },
    lastTriggeredRecordId: { type: String },
  },
  { timestamps: true }
);

export const PriceAlert = mongoose.model<IPriceAlert>('PriceAlert', PriceAlertSchema);
