import mongoose, { Schema, Document } from 'mongoose';

export interface IFPO extends Document {
  fpoId: string;
  name: string;
  registrationNumber: string;
  district: string;
  state: string;
  village: string;
  cropsSupported: string[];
  memberCount: number;
  description: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FPOSchema = new Schema<IFPO>(
  {
    fpoId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'Maharashtra' },
    village: { type: String, required: true },
    cropsSupported: [{ type: String }],
    memberCount: { type: Number, default: 0 },
    description: { type: String },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FPO = mongoose.model<IFPO>('FPO', FPOSchema);
