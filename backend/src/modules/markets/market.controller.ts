import { Request, Response, NextFunction } from 'express';
import { Market } from './market.model';
import { getRankedMarkets } from './ranking.service';

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

export const getRankedMarketsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      cropName: (req.body.cropName || req.query.cropName || req.body.commodity || req.query.commodity || 'Onion') as string,
      origin: (req.body.origin || req.query.origin) as string,
      district: (req.body.district || req.query.district || 'Nashik') as string,
      farmerLat: req.body.farmerLat ? parseFloat(req.body.farmerLat) : req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      farmerLng: req.body.farmerLng ? parseFloat(req.body.farmerLng) : req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      quantityQtl: req.body.quantityQtl ? parseFloat(req.body.quantityQtl) : req.query.quantityQtl ? parseFloat(req.query.quantityQtl as string) : 10,
      grade: (req.body.grade || req.query.grade) as string,
      vehicle: (req.body.vehicle || req.query.vehicle || 'medium_pickup') as string,
      transportRatePerKm: req.body.transportRatePerKm ? parseFloat(req.body.transportRatePerKm) : req.query.transportRatePerKm ? parseFloat(req.query.transportRatePerKm as string) : 1.5,
      labourPerTrip: req.body.labourPerTrip ? parseFloat(req.body.labourPerTrip) : req.query.labourPerTrip ? parseFloat(req.query.labourPerTrip as string) : 500,
      isColdChain: req.body.isColdChain === true || req.query.isColdChain === 'true',
    };

    const ranked = await getRankedMarkets(params);

    res.status(200).json({
      success: true,
      count: ranked.length,
      data: ranked,
    });
  } catch (err) {
    next(err);
  }
};
