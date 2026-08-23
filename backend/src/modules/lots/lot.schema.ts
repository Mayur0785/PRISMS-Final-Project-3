import { z } from 'zod';

export const createLotSchema = z.object({
  body: z.object({
    cropBatchId: z.string().optional(),
    cropName: z.string().min(1, 'Crop name is required'),
    variety: z.string().optional(),
    grade: z.string().optional(),
    provisionalGrade: z.string().optional(),
    quantityQtl: z.coerce.number().positive('Quantity must be greater than 0'),
    qualityScore: z.coerce.number().min(0).max(100).optional(),
    evidenceConfidence: z.coerce.number().min(0).max(100).optional(),
    qualityAssessmentId: z.any().optional(),
    qualityPassport: z.any().optional(),
    origin: z.string().optional(),
    district: z.string().optional(),
    targetMarket: z.string().optional(),
    expectedPricePerQtl: z.coerce.number().positive('Expected price must be positive'),
    minimumAcceptablePrice: z.coerce.number().positive('Minimum price must be positive').optional(),
    buyerVisibility: z.enum(['PUBLIC', 'MATCHED_BUYERS_ONLY', 'PRIVATE']).optional(),
    lotStatus: z.enum(['DRAFT', 'READY', 'PUBLISHED', 'MATCHED', 'OFFERED', 'ACCEPTED', 'CLOSED']).optional(),
    notes: z.string().optional(),
  }),
});

export const updateLotSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lot ID is required'),
  }),
  body: z.object({
    cropBatchId: z.string().optional(),
    cropName: z.string().optional(),
    variety: z.string().optional(),
    grade: z.string().optional(),
    provisionalGrade: z.string().optional(),
    quantityQtl: z.number().positive().optional(),
    qualityScore: z.number().min(0).max(100).optional(),
    evidenceConfidence: z.number().min(0).max(100).optional(),
    qualityAssessmentId: z.any().optional(),
    qualityPassport: z.any().optional(),
    origin: z.string().optional(),
    district: z.string().optional(),
    targetMarket: z.string().optional(),
    expectedPricePerQtl: z.number().positive().optional(),
    minimumAcceptablePrice: z.number().positive().optional(),
    buyerVisibility: z.enum(['PUBLIC', 'MATCHED_BUYERS_ONLY', 'PRIVATE']).optional(),
    lotStatus: z.enum(['DRAFT', 'READY', 'PUBLISHED', 'MATCHED', 'OFFERED', 'ACCEPTED', 'CLOSED']).optional(),
    notes: z.string().optional(),
  }),
});
