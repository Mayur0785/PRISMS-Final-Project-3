import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  refreshToken?: string;
  name?: string;
  role: 'farmer' | 'buyer' | 'fpo' | 'advisor';
  phone?: string;
  village?: string;
  district?: string;
  landholdingAcres?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    refreshToken: { type: String },
    name: { type: String },
    role: { type: String, enum: ['farmer', 'buyer', 'fpo', 'advisor'], default: 'farmer' },
    phone: { type: String },
    village: { type: String },
    district: { type: String },
    landholdingAcres: { type: Number },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
