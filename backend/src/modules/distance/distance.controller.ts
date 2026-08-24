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
    let isGoogleRoutesSuccess = false;

    try {
      if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here') {
        const originObj = origins[0];

        const requestBody = {
          origins: [
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: originObj.lat,
                    longitude: originObj.lng,
                  },
                },
              },
            },
          ],
          destinations: destinations.map((d: any) => ({
            waypoint: {
              location: {
                latLng: {
                  latitude: d.lat,
                  longitude: d.lng,
                },
              },
            },
          })),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_UNAWARE',
        };

        const response = await axios.post(
          'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
              'X-Goog-FieldMask': 'originIndex,destinationIndex,status,condition,distanceMeters,duration',
            },
            timeout: 5000,
          }
        );

        if (Array.isArray(response.data) && response.data.length > 0) {
          const tempMap = new Map<number, number>();
          for (const item of response.data) {
            const destIdx = item.destinationIndex;
            const distMeters = item.distanceMeters;
            if (destIdx !== undefined && distMeters !== undefined && (item.condition === 'ROUTE_EXISTS' || !item.condition)) {
              tempMap.set(destIdx, parseFloat((distMeters / 1000).toFixed(2)));
            }
          }

          if (tempMap.size === destinations.length) {
            distancesKm = destinations.map((_: any, idx: number) => tempMap.get(idx) ?? null);
            if (distancesKm.every((d) => d !== null)) {
              isGoogleRoutesSuccess = true;
              console.log(`✨ Google Routes API SUCCESS: Computed ${distancesKm.length} road routes via ComputeRouteMatrix.`);
            }
          }
        }
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.response?.data?.error?.message || apiErr?.message || 'Google Routes API request failed';
      console.warn(`⚠️ Google Routes API FALLBACK Triggered: ${errMsg}`);
    }

    // Geodesic / Haversine fallback with 1.35x Indian rural road-factor (engaged ONLY when Google Routes API fails)
    if (distancesKm.length === 0 || distancesKm.every((d) => d === null)) {
      console.log('📌 Using Haversine x1.35 Calibrated Fallback Distance Calculator');
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
      source: isGoogleRoutesSuccess ? 'google_routes_api_v2' : 'haversine_road_approximation',
    });
  } catch (err) {
    next(err);
  }
};
