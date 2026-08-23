import mongoose, { Schema, Document } from 'mongoose';

export type GrievanceCategory =
  | 'PRICE_DISPUTE'
  | 'QUANTITY_MISMATCH'
  | 'QUALITY_DISPUTE'
  | 'DELIVERY_DELAY'
  | 'PAYMENT_DELAY'
  | 'BUYER_ISSUE'
  | 'LOGISTICS_ISSUE'
  | 'OTHER';

export type GrievancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type GrievanceStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED';

export interface IGrievance extends Document {
  grievanceId: string;
  transactionId?: Schema.Types.ObjectId;
  lotId?: Schema.Types.ObjectId;
  raisedBy: Schema.Types.ObjectId;
  buyerId?: string;
  category: GrievanceCategory;
  description: string;
  evidence?: string[];
  priority: GrievancePriority;
  status: GrievanceStatus;
  assignedTo?: string;
  resolutionNote?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GrievanceSchema = new Schema<IGrievance>(
  {
    grievanceId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    lotId: { type: Schema.Types.ObjectId, ref: 'Lot' },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId: { type: String },
    category: {
      type: String,
      enum: [
        'PRICE_DISPUTE',
        'QUANTITY_MISMATCH',
        'QUALITY_DISPUTE',
        'DELIVERY_DELAY',
        'PAYMENT_DELAY',
        'BUYER_ISSUE',
        'LOGISTICS_ISSUE',
        'OTHER',
      ],
      required: true,
    },
    description: { type: String, required: true },
    evidence: [{ type: String }],
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedTo: { type: String, default: 'PRISMS APMC Grievance Cell (Simulated)' },
    resolutionNote: { type: String },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Grievance = mongoose.model<IGrievance>('Grievance', GrievanceSchema);
