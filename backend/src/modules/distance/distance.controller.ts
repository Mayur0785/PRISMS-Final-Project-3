import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { env } from '../../config/env';

export const getDistanceMatrix = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origins, destinations } = req.body;

    if (!env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
      return res.status(400).json({
        success: false,
        message: 'Google Maps API key is not configured.'
      });
    }

    let distancesKm: (number | null)[] = [];

    try {
      if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here') {
        const originsStr = origins.map((o: any) => `${o.lat},${o.lng}`).join('|');
        const destStr = destinations.map((d: any) => `${d.lat},${d.lng}`).join('|');

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: originsStr,
            destinations: destStr,
            key: env.GOOGLE_MAPS_API_KEY
          },
          timeout: 5000
        });

        if (response.data.status === 'OK' && response.data.rows?.[0]?.elements) {
          distancesKm = response.data.rows[0].elements.map((element: any) => {
            return element.status === 'OK' ? element.distance.value / 1000 : null;
          });
        }
      }
    } catch (apiErr) {
      // Fallback silently to Haversine
    }

    // Geodesic / Haversine fallback with 1.35x Indian rural road-factor
    if (distancesKm.length === 0 || distancesKm.every(d => d === null)) {
      const origin = origins[0];
      const R = 6371; // Earth radius in km
      distancesKm = destinations.map((dest: any) => {
        const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
        const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((dest.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightLineKm = R * c;
        return parseFloat((straightLineKm * 1.35).toFixed(2)); // 1.35x road factor
      });
    }

    res.status(200).json({
      success: true,
      data: distancesKm,
      source: 'haversine_road_approximation'
    });
  } catch (err) {
    next(err);
  }
};
