import mongoose, { Schema, Document } from 'mongoose';

export type DemandStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'FULFILLED';

export interface IBuyerDemand extends Document {
  buyerId: string; // Reference to Buyer buyerId
  commodity: string;
  variety?: string;
  requiredGrade: string;
  minQuantityQtl: number;
  maxQuantityQtl: number;
  targetPriceMin: number;
  targetPriceMax: number;
  deliveryLocation: string;
  demandStatus: DemandStatus;
  validUntil: Date;
  isDemo: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerDemandSchema = new Schema<IBuyerDemand>(
  {
    buyerId: { type: String, required: true, index: true },
    commodity: { type: String, required: true, index: true },
    variety: { type: String },
    requiredGrade: { type: String, required: true, default: 'A' },
    minQuantityQtl: { type: Number, required: true, default: 10 },
    maxQuantityQtl: { type: Number, required: true, default: 100 },
    targetPriceMin: { type: Number, required: true },
    targetPriceMax: { type: Number, required: true },
    deliveryLocation: { type: String, required: true },
    demandStatus: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED', 'FULFILLED'],
      default: 'ACTIVE',
      index: true,
    },
    validUntil: { type: Date, required: true },
    isDemo: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

BuyerDemandSchema.index({ commodity: 1, demandStatus: 1 });

export const BuyerDemand = mongoose.model<IBuyerDemand>('BuyerDemand', BuyerDemandSchema);
