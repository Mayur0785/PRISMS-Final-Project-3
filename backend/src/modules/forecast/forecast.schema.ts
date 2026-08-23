import { z } from 'zod';

export const getForecastSchema = z.object({
  query: z.object({
    marketId: z.string().optional(),
    commodity: z.string(),
    days: z.string().optional().default('7'),
  }),
});
