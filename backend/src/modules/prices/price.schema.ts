import { z } from 'zod';

export const getPricesSchema = z.object({
  query: z.object({
    marketId: z.string().optional(),
    marketIds: z.string().optional(),
    commodity: z.string().optional(),
    commodityId: z.string().optional(),
    source: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).passthrough(),
});
