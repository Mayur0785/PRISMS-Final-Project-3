import { Request, Response, NextFunction } from 'express';
import { Market } from '../markets/market.model';
import { Price } from '../prices/price.model';
import { getDistanceFromLatLonInKm } from '../../utils/geo';

// Authoritative rates based on NABCONS 2022 Post-Harvest Loss Study & Maharashtra APMC Acts
export const NABCONS_SPOILAGE_RATES: Record<string, number> = {
  'Tomato': 0.12,   // 12% (~11.61% NABCONS 2022)
  'Banana': 0.09,   // 9%
  'Onion': 0.08,    // 8% (Red Onion)
  'Grapes': 0.15,   // 15%
  'Wheat': 0.05,    // 5%
  'Soybeans': 0.04, // 4%
  'Potato': 0.04,   // 4%
  'Cotton': 0.03,   // 3%
};

// Authoritative farmer-borne market handling benchmark (1.0% estimated hamali, weighing & loading charges)
const FARMER_HANDLING_FEE_RATE = 0.01;

export const VEHICLE_CAPACITIES: Record<string, number> = {
  small_pickup: 10,   // 10 Qtl (Chhota Hathi)
  medium_pickup: 30,  // 30 Qtl (Bolero MaxiTruck)
  tata_407: 50,       // 50 Qtl (Tata 407 / Eicher)
  mini_truck: 80,     // 80 Qtl (6-Wheeler Mini Truck)
  large_truck: 150,   // 150 Qtl (Multi-Axle Large Truck)
};

export const calculateNetEarning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      commodity,
      quantityQuintals,
      farmerLat,
      farmerLng,
      transportRatePerKm = 1.5,
      vehicle = 'medium_pickup',
      labourPerTrip = 500,
      isColdChain = false,
    } = req.body;

    // 1. Find closest markets that support the commodity
    let nearbyMarkets = await Market.find({
      commodities: new RegExp(`^${commodity}$`, 'i'),
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [farmerLng, farmerLat]
          },
          $maxDistance: 300000 // 300km radius
        }
      }
    }).limit(10);

    if (nearbyMarkets.length === 0) {
      nearbyMarkets = await Market.find({
        commodities: new RegExp(`^${commodity}$`, 'i')
      }).limit(10);
    }

    if (nearbyMarkets.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No nearby markets found for this commodity' } });
    }

    const qtyQtl = Number(quantityQuintals) || 10;
    const vehicleCapacity = VEHICLE_CAPACITIES[vehicle] || 30;
    const trips = Math.max(1, Math.ceil(qtyQtl / vehicleCapacity));
    const totalLabourCost = Math.round((Number(labourPerTrip) || 0) * trips);

    // Match exact key or default to 5%
    const normalizedCommodity = Object.keys(NABCONS_SPOILAGE_RATES).find(k => k.toLowerCase() === commodity.toLowerCase());
    const baseSpoilageRate = normalizedCommodity ? NABCONS_SPOILAGE_RATES[normalizedCommodity] : 0.05; 
    const spoilageRate = isColdChain ? baseSpoilageRate * 0.5 : baseSpoilageRate;

    const results = [];

    // 2. Fetch prices and calculate net earning for each market
    for (const market of nearbyMarkets) {
      // Get most recent price
      const latestPrice = await Price.findOne({ 
        marketId: market._id,
        commodity: new RegExp(`^${commodity}$`, 'i')
      }).sort({ date: -1 });

      if (!latestPrice) continue;

      const [marketLng, marketLat] = market.location.coordinates;
      const distanceKm = getDistanceFromLatLonInKm(farmerLat, farmerLng, marketLat, marketLng);

      const grossValue = latestPrice.modalPrice * qtyQtl;
      const transportCost = distanceKm * transportRatePerKm * qtyQtl;
      const spoilageLoss = grossValue * spoilageRate;
      const marketCharges = grossValue * FARMER_HANDLING_FEE_RATE;

      const netEarning = grossValue - transportCost - totalLabourCost - spoilageLoss - marketCharges;

      results.push({
        market: {
          _id: market._id,
          name: market.name,
          district: market.district,
          distanceKm: parseFloat(distanceKm.toFixed(2)),
        },
        price: {
          modalPrice: latestPrice.modalPrice,
          date: latestPrice.date,
        },
        trips,
        vehicleCapacity,
        breakdown: {
          grossValue: parseFloat(grossValue.toFixed(2)),
          transportCost: parseFloat(transportCost.toFixed(2)),
          labourCost: parseFloat(totalLabourCost.toFixed(2)),
          totalLogisticsCost: parseFloat((transportCost + totalLabourCost).toFixed(2)),
          spoilageLoss: parseFloat(spoilageLoss.toFixed(2)),
          marketCharges: parseFloat(marketCharges.toFixed(2)),
          mandiFee: parseFloat(marketCharges.toFixed(2)),
          netEarning: parseFloat(netEarning.toFixed(2)),
        }
      });
    }

    // 3. Rank strictly by highest net earning
    results.sort((a, b) => b.breakdown.netEarning - a.breakdown.netEarning);

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (err) {
    next(err);
  }
};
