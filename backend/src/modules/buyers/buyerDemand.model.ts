import mongoose, { Schema, Document } from 'mongoose';

export type DemandStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'FULFILLED' | 'OPEN';

export interface IBuyerDemand extends Document {
  demandId: string;
  buyerId: string; // Reference to Buyer buyerId
  commodity: string;
  variety?: string;
  requiredGrade: string;
  targetGrade?: string;
  quantityRequiredQtl?: number;
  minQuantityQtl: number;
  maxQuantityQtl: number;
  targetPriceMin: number;
  targetPriceMax: number;
  preferredDistricts?: string[];
  deliveryPreference?: string;
  deliveryLocation: string;
  urgency?: string;
  demandStatus: DemandStatus;
  status?: string;
  validUntil: Date;
  isDemo: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerDemandSchema = new Schema<IBuyerDemand>(
  {
    demandId: { type: String, unique: true, index: true },
    buyerId: { type: String, required: true, index: true },
    commodity: { type: String, required: true, index: true },
    variety: { type: String },
    requiredGrade: { type: String, required: true, default: 'Grade A' },
    targetGrade: { type: String, default: 'Grade A' },
    quantityRequiredQtl: { type: Number, default: 50 },
    minQuantityQtl: { type: Number, default: 10 },
    maxQuantityQtl: { type: Number, default: 100 },
    targetPriceMin: { type: Number, required: true },
    targetPriceMax: { type: Number, required: true },
    preferredDistricts: { type: [String], default: ['Nashik'] },
    deliveryPreference: { type: String, default: 'Buyer Pickup' },
    deliveryLocation: { type: String, default: 'Mandi Yard / Warehouse' },
    urgency: { type: String, default: 'HIGH' },
    demandStatus: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED', 'FULFILLED', 'OPEN'],
      default: 'ACTIVE',
      index: true,
    },
    status: { type: String, default: 'ACTIVE' },
    validUntil: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) },
    isDemo: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

BuyerDemandSchema.index({ commodity: 1, demandStatus: 1 });

export const BuyerDemand = mongoose.model<IBuyerDemand>('BuyerDemand', BuyerDemandSchema);
