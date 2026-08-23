import mongoose, { Schema, Document } from 'mongoose';

export type QualityGrade = 'Grade A' | 'Grade B' | 'Grade C' | 'REVIEW' | 'A+' | 'A' | 'B' | 'C' | 'D';

export interface ILotAssessment extends Document {
  assessmentId: string;
  farmerId: Schema.Types.Mixed;
  lotId?: Schema.Types.Mixed;
  cropBatchId?: Schema.Types.Mixed;
  cropName: string;
  variety?: string;
  answers: Array<{
    questionId: string;
    parameterId: string;
    value: any;
    evidenceSource?: string;
  }>;
  parameterScores: Record<string, any>;
  qualityScore: number; // 0 - 100
  provisionalGrade: string; // 'Grade A' | 'Grade B' | 'Grade C' | 'REVIEW'
  evidenceConfidence: number; // 0 - 100
  criticalFlags: string[];
  positiveFactors: string[];
  riskFactors: string[];
  passportSummary: Record<string, any>;
  isProvisional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LotAssessmentSchema = new Schema<ILotAssessment>(
  {
    assessmentId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: Schema.Types.Mixed, required: true, index: true },
    lotId: { type: Schema.Types.Mixed, index: true },
    cropBatchId: { type: Schema.Types.Mixed },
    cropName: { type: String, required: true, index: true },
    variety: { type: String, default: 'Garwa' },
    answers: [
      {
        questionId: { type: String, required: true },
        parameterId: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        evidenceSource: { type: String, default: 'Physical sample' },
      },
    ],
    parameterScores: { type: Schema.Types.Mixed, default: {} },
    qualityScore: { type: Number, required: true, min: 0, max: 100 },
    provisionalGrade: { type: String, required: true, default: 'Grade A' },
    evidenceConfidence: { type: Number, required: true, min: 0, max: 100, default: 80 },
    criticalFlags: [{ type: String }],
    positiveFactors: [{ type: String }],
    riskFactors: [{ type: String }],
    passportSummary: { type: Schema.Types.Mixed, default: {} },
    isProvisional: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LotAssessmentSchema.index({ farmerId: 1, createdAt: -1 });

export const QualityAssessment = mongoose.model<ILotAssessment>('QualityAssessment', LotAssessmentSchema);
export const LotAssessment = QualityAssessment; // Alias for semantic clarity
