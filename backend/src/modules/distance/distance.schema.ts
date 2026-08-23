import { z } from 'zod';

export const getDistanceMatrixSchema = z.object({
  body: z.object({
    origins: z.array(z.object({
      lat: z.number(),
      lng: z.number()
    })).min(1),
    destinations: z.array(z.object({
      lat: z.number(),
      lng: z.number()
    })).min(1),
  })
});
