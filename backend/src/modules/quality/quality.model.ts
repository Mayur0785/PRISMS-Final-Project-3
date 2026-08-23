import mongoose, { Schema, Document } from 'mongoose';

export type QualityGrade = 'A+' | 'A' | 'B' | 'C' | 'D';
export type AssessmentMethod = 'RULE_BASED' | 'USER_INPUT' | 'DEMO_AI_ASSISTED';

export interface IQualityAssessment extends Document {
  assessmentId: string;
  userId: Schema.Types.ObjectId;
  cropBatchId?: Schema.Types.ObjectId;
  lotId?: Schema.Types.ObjectId;
  cropName: string;
  variety?: string;
  moisturePercent?: number;
  sizeScore?: number;
  colorScore?: number;
  firmnessScore?: number;
  visibleDamagePercent?: number;
  decayPercent?: number;
  cleanlinessScore?: number;
  overallScore: number;
  estimatedGrade: QualityGrade;
  qualityNotes: string;
  assessmentMethod: AssessmentMethod;
  createdAt: Date;
  updatedAt: Date;
}

const QualityAssessmentSchema = new Schema<IQualityAssessment>(
  {
    assessmentId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropBatchId: { type: Schema.Types.ObjectId },
    lotId: { type: Schema.Types.ObjectId },
    cropName: { type: String, required: true },
    variety: { type: String },
    moisturePercent: { type: Number },
    sizeScore: { type: Number },
    colorScore: { type: Number },
    firmnessScore: { type: Number },
    visibleDamagePercent: { type: Number },
    decayPercent: { type: Number },
    cleanlinessScore: { type: Number },
    overallScore: { type: Number, required: true },
    estimatedGrade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'D'],
      required: true,
    },
    qualityNotes: { type: String },
    assessmentMethod: {
      type: String,
      enum: ['RULE_BASED', 'USER_INPUT', 'DEMO_AI_ASSISTED'],
      default: 'RULE_BASED',
    },
  },
  { timestamps: true }
);

export const QualityAssessment = mongoose.model<IQualityAssessment>('QualityAssessment', QualityAssessmentSchema);
