import mongoose, { Schema, Document } from 'mongoose';

export interface ICropBatch extends Document {
  userId: mongoose.Types.ObjectId;
  cropName: string;
  variety?: string;
  quantityKg: number;
  grade: string;
  targetMandi: string;
  status: 'Peak Price' | 'Holding (Wait)' | 'Standard' | 'Sold';
  estimatedRealization: number;
  createdAt: Date;
  updatedAt: Date;
}

const CropBatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropName: { type: String, required: true },
    variety: { type: String },
    quantityKg: { type: Number, required: true, min: 1 },
    grade: { type: String, default: 'Grade 1' },
    targetMandi: { type: String, default: 'Vashi APMC' },
    status: {
      type: String,
      enum: ['Peak Price', 'Holding (Wait)', 'Standard', 'Sold'],
      default: 'Standard',
    },
    estimatedRealization: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Compound Index for fast user crop lookup sorted by recency
CropBatchSchema.index({ userId: 1, createdAt: -1 });

export const CropBatch = mongoose.model<ICropBatch>('CropBatch', CropBatchSchema);
