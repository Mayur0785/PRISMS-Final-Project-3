import mongoose, { Schema, Document } from 'mongoose';

export type OfferStatus = 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';

export interface IOffer extends Document {
  offerId: string;
  lotId: any;
  buyerId: string;
  sellerUserId: any;
  commodity: string;
  variety: string;
  grade: string;
  quantityQtl: number;
  pricePerQtl: number;
  grossValue: number;
  estimatedTransportCost: number;
  estimatedLabourCost: number;
  estimatedSpoilage: number;
  estimatedMarketHandlingCharges: number;
  estimatedNetRealization: number;
  paymentTerms: string;
  deliveryTerms: string;
  pickupLocation: string;
  deliveryLocation: string;
  expiresAt: Date;
  offerStatus: OfferStatus;
  counterPricePerQtl?: number;
  counterQuantityQtl?: number;
  counterMessage?: string;
  counterBy?: 'FARMER' | 'BUYER';
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    offerId: { type: String, required: true, unique: true, index: true },
    lotId: { type: Schema.Types.Mixed, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    sellerUserId: { type: Schema.Types.Mixed, required: true, index: true },
    commodity: { type: String, required: true },
    variety: { type: String, default: 'Standard' },
    grade: { type: String, required: true },
    quantityQtl: { type: Number, required: true },
    pricePerQtl: { type: Number, required: true },
    grossValue: { type: Number, required: true },
    estimatedTransportCost: { type: Number, required: true, default: 0 },
    estimatedLabourCost: { type: Number, required: true, default: 0 },
    estimatedSpoilage: { type: Number, required: true, default: 0 },
    estimatedMarketHandlingCharges: { type: Number, required: true, default: 0 },
    estimatedNetRealization: { type: Number, required: true },
    paymentTerms: { type: String, default: 'T+1 Direct Bank Transfer (Simulated Escrow)' },
    deliveryTerms: { type: String, default: 'Buyer Pickup / Factory Gate Delivery' },
    pickupLocation: { type: String, required: true },
    deliveryLocation: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    offerStatus: {
      type: String,
      enum: ['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'],
      default: 'PENDING',
      index: true,
    },
    counterPricePerQtl: { type: Number },
    counterQuantityQtl: { type: Number },
    counterMessage: { type: String },
    counterBy: { type: String, enum: ['FARMER', 'BUYER'] },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

OfferSchema.index({ sellerUserId: 1, offerStatus: 1 });

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
