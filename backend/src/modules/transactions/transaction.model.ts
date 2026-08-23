import mongoose, { Schema, Document } from 'mongoose';

export type TransactionStatus =
  | 'INITIATED'
  | 'OFFER_ACCEPTED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface ITransaction extends Document {
  transactionId: string;
  lotId: Schema.Types.ObjectId;
  offerId: Schema.Types.ObjectId;
  deliveryId?: Schema.Types.ObjectId;
  paymentId?: Schema.Types.ObjectId;
  farmerId: Schema.Types.ObjectId;
  buyerId: string;
  crop: string;
  variety: string;
  grade: string;
  quantityQtl: number;
  agreedPricePerQtl: number;
  grossAmount: number;
  totalDeductions: number;
  finalNetAmount: number;
  transactionStatus: TransactionStatus;
  completedAt?: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    lotId: { type: Schema.Types.Mixed, required: true, index: true },
    offerId: { type: Schema.Types.Mixed, required: true },
    deliveryId: { type: Schema.Types.Mixed },
    paymentId: { type: Schema.Types.Mixed },
    farmerId: { type: Schema.Types.Mixed, required: true, index: true },
    buyerId: { type: String, required: true },
    crop: { type: String, required: true },
    variety: { type: String, default: 'Standard' },
    grade: { type: String, required: true },
    quantityQtl: { type: Number, required: true },
    agreedPricePerQtl: { type: Number, required: true },
    grossAmount: { type: Number, required: true },
    totalDeductions: { type: Number, required: true, default: 0 },
    finalNetAmount: { type: Number, required: true },
    transactionStatus: {
      type: String,
      enum: [
        'INITIATED',
        'OFFER_ACCEPTED',
        'IN_DELIVERY',
        'DELIVERED',
        'PAYMENT_PENDING',
        'COMPLETED',
        'DISPUTED',
        'CANCELLED',
      ],
      default: 'OFFER_ACCEPTED',
      index: true,
    },
    completedAt: { type: Date },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ farmerId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
