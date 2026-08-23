import mongoose, { Schema, Document } from 'mongoose';

export type PoolingStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'READY_FOR_SALE'
  | 'MATCHED'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IFarmerContribution {
  farmerId: Schema.Types.ObjectId;
  farmerName?: string;
  quantityQtl: number;
  lotId?: Schema.Types.ObjectId;
  contributionPercent: number;
  joinedAt: Date;
}

export interface IGroupHarvestPool extends Document {
  poolId: string;
  fpoId: string;
  crop: string;
  variety: string;
  grade: string;
  totalQuantityQtl: number;
  targetMarket: string;
  farmerContributions: IFarmerContribution[];
  poolingStatus: PoolingStatus;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FarmerContributionSchema = new Schema<IFarmerContribution>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName: { type: String },
    quantityQtl: { type: Number, required: true },
    lotId: { type: Schema.Types.ObjectId, ref: 'Lot' },
    contributionPercent: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupHarvestPoolSchema = new Schema<IGroupHarvestPool>(
  {
    poolId: { type: String, required: true, unique: true, index: true },
    fpoId: { type: String, required: true, index: true },
    crop: { type: String, required: true },
    variety: { type: String, default: 'Garwa' },
    grade: { type: String, default: 'Grade A' },
    totalQuantityQtl: { type: Number, required: true, default: 0 },
    targetMarket: { type: String, default: 'Lasalgaon APMC / Direct Commercial Buyer' },
    farmerContributions: [FarmerContributionSchema],
    poolingStatus: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'READY_FOR_SALE', 'MATCHED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GroupHarvestPool = mongoose.model<IGroupHarvestPool>('GroupHarvestPool', GroupHarvestPoolSchema);
