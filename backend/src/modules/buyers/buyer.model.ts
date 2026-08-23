import mongoose, { Schema, Document } from 'mongoose';

export type BuyerType = 'Processor' | 'Wholesaler' | 'Institutional Buyer' | 'Retail Chain' | 'Exporter' | 'FPO Aggregator';

export interface IBuyer extends Document {
  buyerId: string;
  businessName: string;
  buyerType: BuyerType;
  location: string;
  district: string;
  state: string;
  cropsInterested: string[];
  preferredGrades: string[];
  minQuantityQtl: number;
  maxQuantityQtl: number;
  targetPriceMin: number;
  targetPriceMax: number;
  deliveryPreference: string;
  paymentTerms: string;
  verificationStatus: string;
  isDemo: boolean;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerSchema = new Schema<IBuyer>(
  {
    buyerId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    buyerType: {
      type: String,
      required: true,
      enum: ['Processor', 'Wholesaler', 'Institutional Buyer', 'Retail Chain', 'Exporter', 'FPO Aggregator'],
    },
    location: { type: String, required: true },
    district: { type: String, required: true, index: true },
    state: { type: String, required: true, default: 'Maharashtra' },
    cropsInterested: [{ type: String, required: true }],
    preferredGrades: [{ type: String, default: ['A', 'B', 'FAQ'] }],
    minQuantityQtl: { type: Number, required: true, default: 10 },
    maxQuantityQtl: { type: Number, required: true, default: 200 },
    targetPriceMin: { type: Number, required: true },
    targetPriceMax: { type: Number, required: true },
    deliveryPreference: { type: String, default: 'Buyer Pickup' },
    paymentTerms: { type: String, default: 'T+1 Bank Transfer (Simulated)' },
    verificationStatus: { type: String, default: 'Sample Buyer Profile' },
    isDemo: { type: Boolean, default: true },
    description: { type: String },
    contactPhone: { type: String, default: '+91 98220 00000 (Demo)' },
    contactEmail: { type: String, default: 'trade@demobuyer.co.in' },
  },
  { timestamps: true }
);

BuyerSchema.index({ district: 1, buyerType: 1 });

export const Buyer = mongoose.model<IBuyer>('Buyer', BuyerSchema);
