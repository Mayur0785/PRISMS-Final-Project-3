import { z } from 'zod';

export const createCropSchema = z.object({
  body: z.object({
    cropName: z.string().min(1, 'Crop name is required'),
    variety: z.string().optional(),
    quantityKg: z.number().min(1, 'Quantity in kg must be at least 1'),
    grade: z.string().optional(),
    targetMandi: z.string().optional(),
    status: z.enum(['Peak Price', 'Holding (Wait)', 'Standard', 'Sold']).optional(),
    estimatedRealization: z.number().optional(),
  }),
});

export const updateCropSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Crop ID is required'),
  }),
  body: z.object({
    cropName: z.string().optional(),
    variety: z.string().optional(),
    quantityKg: z.number().min(1).optional(),
    grade: z.string().optional(),
    targetMandi: z.string().optional(),
    status: z.enum(['Peak Price', 'Holding (Wait)', 'Standard', 'Sold']).optional(),
    estimatedRealization: z.number().optional(),
  }),
});

export const cropParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Crop ID is required'),
  }),
});

