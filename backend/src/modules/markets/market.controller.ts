import { Request, Response, NextFunction } from 'express';
import { Market } from './market.model';

export const getMarkets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { state, district, commodity, lat, lng, radius } = req.query;

    let query: any = {};

    if (state) query.state = new RegExp(state as string, 'i');
    if (district) query.district = new RegExp(district as string, 'i');
    if (commodity) query.commodities = new RegExp(commodity as string, 'i');

    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const maxDistance = radius ? parseFloat(radius as string) * 1000 : 50000; // default 50km

      if (!isNaN(latitude) && !isNaN(longitude)) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude] // Note: MongoDB expects [lng, lat]
            },
            $maxDistance: maxDistance
          }
        };
      }
    }

    const markets = await Market.find(query).limit(50); // limit for safety
    
    res.status(200).json({
      success: true,
      data: markets
    });
  } catch (err) {
    next(err);
  }
};
