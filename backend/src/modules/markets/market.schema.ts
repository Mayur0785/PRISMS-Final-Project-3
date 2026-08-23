import { z } from 'zod';

export const getMarketsSchema = z.object({
  query: z.object({
    state: z.string().optional(),
    district: z.string().optional(),
    commodity: z.string().optional(),
    lat: z.string().refine(v => !isNaN(Number(v)), { message: "Invalid latitude" }).optional(),
    lng: z.string().refine(v => !isNaN(Number(v)), { message: "Invalid longitude" }).optional(),
    radius: z.string().optional(), // In kilometers
  }).refine(data => {
    // If lat or lng is provided, both must be provided
    if ((data.lat && !data.lng) || (!data.lat && data.lng)) {
      return false;
    }
    return true;
  }, {
    message: "Both 'lat' and 'lng' must be provided for geospatial search",
    path: ["lat", "lng"]
  }),
});
