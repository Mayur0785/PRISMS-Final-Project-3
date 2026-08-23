import mongoose, { Schema, Document } from 'mongoose';

export type MemberRole = 'MEMBER' | 'MANAGER' | 'COORDINATOR';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface IFpoMembership extends Document {
  fpoId: string;
  farmerId: Schema.Types.ObjectId;
  memberRole: MemberRole;
  joinedAt: Date;
  status: MemberStatus;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FpoMembershipSchema = new Schema<IFpoMembership>(
  {
    fpoId: { type: String, required: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberRole: {
      type: String,
      enum: ['MEMBER', 'MANAGER', 'COORDINATOR'],
      default: 'MEMBER',
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'ACTIVE',
      index: true,
    },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FpoMembershipSchema.index({ fpoId: 1, farmerId: 1 }, { unique: true });

export const FpoMembership = mongoose.model<IFpoMembership>('FpoMembership', FpoMembershipSchema);
