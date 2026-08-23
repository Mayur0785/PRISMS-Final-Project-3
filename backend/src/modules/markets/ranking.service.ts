import { Market } from './market.model';
import { Price } from '../prices/price.model';
import { getDistanceFromLatLonInKm, resolveCoordinatesForLocation } from '../../utils/geo';
import { NABCONS_SPOILAGE_RATES, VEHICLE_CAPACITIES } from '../netEarning/netEarning.controller';

export interface RankedMarketResult {
  marketId: string;
  marketName: string;
  district: string;
  distanceKm: number;
  modalPrice: number;
  arrivalVolume: number;
  transportCost: number;
  labourCost: number;
  spoilageCost: number;
  marketHandlingCharges: number;
  estimatedLogisticsCost: number;
  estimatedGrossRevenue: number;
  estimatedNetRealization: number;
  estimatedNetPerQtl: number;
  rank: number;
  source: string;
}

export interface RankMarketsParams {
  cropName: string;
  origin?: string;
  district?: string;
  farmerLat?: number;
  farmerLng?: number;
  quantityQtl: number;
  grade?: string;
  vehicle?: string;
  transportRatePerKm?: number;
  labourPerTrip?: number;
  isColdChain?: boolean;
}

/**
 * Authoritative PRISMS Unified Market Ranking Engine
 * Consumed identically by:
 * 1. Market Search / Market Intelligence
 * 2. Buyer Match & Realization Support
 * 3. Trade Lots APMC Benchmark comparison
 */
export async function getRankedMarkets(params: RankMarketsParams): Promise<RankedMarketResult[]> {
  const {
    cropName,
    origin,
    district = 'Nashik',
    quantityQtl = 10,
    vehicle = 'medium_pickup',
    transportRatePerKm = 1.5,
    labourPerTrip = 500,
    isColdChain = false,
  } = params;

  // 1. Resolve Origin Coordinates
  let [farmerLat, farmerLng] = [params.farmerLat, params.farmerLng];
  if (!farmerLat || !farmerLng || isNaN(farmerLat) || isNaN(farmerLng)) {
    const coords = resolveCoordinatesForLocation(origin || district, district);
    farmerLat = coords[0];
    farmerLng = coords[1];
  }

  // 2. Normalize Commodity Name
  const rawCrop = (cropName || 'Onion').trim();
  const cleanCrop = rawCrop
    .replace(/_\d+$/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(red|yellow|white|sharbati|hard|green|fresh|hybrid)\s+/i, '')
    .trim();

  // 3. Find candidate markets in Maharashtra
  const markets = await Market.find({
    commodities: { $in: [new RegExp(cleanCrop, 'i'), new RegExp(rawCrop, 'i')] },
  });

  if (!markets || markets.length === 0) {
    return [];
  }

  // 4. Determine Spoilage Rate (NABCONS Standard)
  const normalizedSpoilageKey = Object.keys(NABCONS_SPOILAGE_RATES).find(
    (k) => k.toLowerCase() === cleanCrop.toLowerCase() || k.toLowerCase() === rawCrop.toLowerCase()
  );
  const baseSpoilageRate = normalizedSpoilageKey ? NABCONS_SPOILAGE_RATES[normalizedSpoilageKey] : 0.05;
  const spoilageRate = isColdChain ? baseSpoilageRate * 0.5 : baseSpoilageRate;

  // 5. Vehicle & Labour Setup
  const qty = Math.max(0.1, Number(quantityQtl) || 10);
  const vehicleCap = VEHICLE_CAPACITIES[vehicle] || 30;
  const trips = Math.max(1, Math.ceil(qty / vehicleCap));
  const totalLabour = Math.round((Number(labourPerTrip) || 0) * trips);

  const rankedResults: RankedMarketResult[] = [];

  for (const market of markets) {
    // Fetch latest verified modal price for this market & commodity
    const latestPrice = await Price.findOne({
      marketId: market._id,
      commodity: { $in: [new RegExp(cleanCrop, 'i'), new RegExp(rawCrop, 'i')] },
      validationStatus: { $ne: 'INVALID' },
    }).sort({ date: -1 });

    if (!latestPrice) continue;

    const [marketLng, marketLat] = market.location.coordinates;
    const distanceKm = parseFloat(getDistanceFromLatLonInKm(farmerLat, farmerLng, marketLat, marketLng).toFixed(1));

    // Normalize modal price to Rupees per Quintal
    const pricePerQtl = latestPrice.modalPrice > 100 ? latestPrice.modalPrice : latestPrice.modalPrice * 100;
    const grossRevenue = Math.round(pricePerQtl * qty);

    // Transport freight (Distance * Rate * Quantity)
    const transportCost = Math.round(distanceKm * transportRatePerKm * qty);
    // Spoilage loss in transit & holding
    const spoilageCost = Math.round(grossRevenue * spoilageRate);
    // 1% APMC fee & weighing/handling benchmark
    const marketHandlingCharges = Math.round(grossRevenue * 0.01);

    const estimatedLogisticsCost = transportCost + totalLabour + spoilageCost + marketHandlingCharges;
    const estimatedNetRealization = grossRevenue - estimatedLogisticsCost;
    const estimatedNetPerQtl = Math.round(estimatedNetRealization / qty);

    rankedResults.push({
      marketId: market._id.toString(),
      marketName: market.name,
      district: market.district || district,
      distanceKm,
      modalPrice: pricePerQtl,
      arrivalVolume: latestPrice.arrivalVolume || 250,
      transportCost,
      labourCost: totalLabour,
      spoilageCost,
      marketHandlingCharges,
      estimatedLogisticsCost,
      estimatedGrossRevenue: grossRevenue,
      estimatedNetRealization,
      estimatedNetPerQtl,
      rank: 0,
      source: latestPrice.source || 'PRISMS_LIVE_GOVT_APMC',
    });
  }

  // 6. Sort strictly by highest Estimated Net Realization descending
  rankedResults.sort((a, b) => b.estimatedNetRealization - a.estimatedNetRealization);

  // 7. Assign 1-indexed ranks
  rankedResults.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return rankedResults;
}
