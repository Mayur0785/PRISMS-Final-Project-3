import { z } from 'zod';

export const getBuyersQuerySchema = z.object({
  commodity: z.string().optional(),
  district: z.string().optional(),
  buyerType: z.string().optional(),
  grade: z.string().optional(),
  minQuantity: z.string().optional(),
  maxQuantity: z.string().optional(),
});

export const getBuyerDemandsQuerySchema = z.object({
  commodity: z.string().optional(),
  buyerId: z.string().optional(),
  grade: z.string().optional(),
  status: z.string().optional(),
});
