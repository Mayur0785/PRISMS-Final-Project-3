import { z } from 'zod';

export const calculateNetEarningSchema = z.object({
  body: z.object({
    commodity: z.string(),
    quantityQuintals: z.number().positive(),
    farmerLat: z.number().min(-90).max(90),
    farmerLng: z.number().min(-180).max(180),
    transportRatePerKm: z.number().positive().optional().default(1.5),
    vehicle: z.string().optional().default('medium_pickup'),
    labourPerTrip: z.number().nonnegative().optional().default(500),
    isColdChain: z.boolean().optional().default(false),
  }),
});
