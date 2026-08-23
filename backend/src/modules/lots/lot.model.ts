import mongoose, { Schema, Document } from 'mongoose';

export type LotStatus = 'DRAFT' | 'READY' | 'PUBLISHED' | 'MATCHED' | 'OFFERED' | 'ACCEPTED' | 'CLOSED';
export type BuyerVisibility = 'PUBLIC' | 'MATCHED_BUYERS_ONLY' | 'PRIVATE';

export interface ILot extends Document {
  lotId: string;
  userId: any;
  cropBatchId?: any;
  cropName: string;
  variety?: string;
  grade: string;
  provisionalGrade?: string;
  quantityQtl: number;
  qualityScore?: number;
  evidenceConfidence?: number;
  qualityAssessmentId?: any;
  qualityPassport?: any;
  origin: string;
  district?: string;
  targetMarket?: string;
  expectedPricePerQtl: number;
  minimumAcceptablePrice: number;
  buyerVisibility: BuyerVisibility;
  lotStatus: LotStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LotSchema = new Schema<ILot>(
  {
    lotId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    cropBatchId: { type: Schema.Types.Mixed },
    cropName: { type: String, required: true, index: true },
    variety: { type: String, default: 'Standard' },
    grade: { type: String, required: true, default: 'Grade A' },
    provisionalGrade: { type: String, default: 'Grade A' },
    quantityQtl: { type: Number, required: true, min: 0.1 },
    qualityScore: { type: Number, min: 0, max: 100, default: 85 },
    evidenceConfidence: { type: Number, min: 0, max: 100, default: 80 },
    qualityAssessmentId: { type: Schema.Types.Mixed, index: true },
    qualityPassport: { type: Schema.Types.Mixed },
    origin: { type: String, required: true, default: 'Farm Gate' },
    district: { type: String, default: 'Nashik' },
    targetMarket: { type: String },
    expectedPricePerQtl: { type: Number, required: true },
    minimumAcceptablePrice: { type: Number, required: true },
    buyerVisibility: {
      type: String,
      enum: ['PUBLIC', 'MATCHED_BUYERS_ONLY', 'PRIVATE'],
      default: 'MATCHED_BUYERS_ONLY',
    },
    lotStatus: {
      type: String,
      enum: ['DRAFT', 'READY', 'PUBLISHED', 'MATCHED', 'OFFERED', 'ACCEPTED', 'CLOSED'],
      default: 'PUBLISHED',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

LotSchema.index({ userId: 1, createdAt: -1 });

export const Lot = mongoose.model<ILot>('Lot', LotSchema);
