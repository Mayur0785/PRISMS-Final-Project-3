import mongoose, { Schema, Document } from 'mongoose';
import { IMarket } from '../markets/market.model';

export interface IPrice extends Document {
  marketId: mongoose.Types.ObjectId | IMarket;
  commodity: string;
  variety: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalVolume: number; // in quintals/tons
  date: Date;
  source: 'LIVE_GOVT_API' | 'SEEDED_HISTORICAL_BENCHMARK';
  sourceRecordKey?: string;
  validationStatus: 'VALIDATED' | 'INVALID' | 'REVIEW';
  validationReason?: string;
  sourcePrice?: number;
  sourceUnit?: string;
  normalizedPrice?: number;
  normalizedUnit?: string;
  fetchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriceSchema = new Schema(
  {
    marketId: { type: Schema.Types.ObjectId, ref: 'Market', required: true },
    commodity: { type: String, required: true },
    variety: { type: String, default: 'Standard' },
    grade: { type: String, default: 'FAQ' },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true },
    arrivalVolume: { type: Number, default: 0 },
    date: { type: Date, required: true },
    source: {
      type: String,
      enum: ['LIVE_GOVT_API', 'SEEDED_HISTORICAL_BENCHMARK'],
      default: 'SEEDED_HISTORICAL_BENCHMARK',
    },
    sourceRecordKey: { type: String, unique: true, sparse: true },
    validationStatus: {
      type: String,
      enum: ['VALIDATED', 'INVALID', 'REVIEW'],
      default: 'REVIEW',
    },
    validationReason: { type: String, default: '' },
    sourcePrice: { type: Number },
    sourceUnit: { type: String, default: 'Rs/Quintal' },
    normalizedPrice: { type: Number },
    normalizedUnit: { type: String, default: 'Qtl' },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for rapid retrieval & deterministic duplicate prevention on sync
PriceSchema.index({ marketId: 1, commodity: 1, date: -1 }, { unique: false });
PriceSchema.index(
  { marketId: 1, commodity: 1, variety: 1, grade: 1, date: 1 },
  { unique: true, sparse: true }
);

export const Price = mongoose.model<IPrice>('Price', PriceSchema);
