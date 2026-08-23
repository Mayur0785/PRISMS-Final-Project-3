import { ILot } from './lot.model';
import { Buyer, IBuyer } from '../buyers/buyer.model';
import { BuyerDemand, IBuyerDemand } from '../buyers/buyerDemand.model';
import { Market } from '../markets/market.model';
import { Price } from '../prices/price.model';

export interface BuyerMatchResult {
  buyer: {
    buyerId: string;
    businessName: string;
    buyerType: string;
    location: string;
    district: string;
    verificationStatus: string;
    isDemo: boolean;
    contactPhone?: string;
    contactEmail?: string;
  };
  demand: {
    demandId: string;
    commodity: string;
    variety?: string;
    requiredGrade: string;
    minQuantityQtl: number;
    maxQuantityQtl: number;
    targetPriceMin: number;
    targetPriceMax: number;
    deliveryLocation: string;
  };
  matchScore: number; // 0 - 100
  scoringBreakdown: {
    cropScore: number;
    gradeScore: number;
    quantityScore: number;
    priceScore: number;
    locationScore: number;
    varietyScore: number;
  };
  reasons: string[];
  warnings: string[];
  quotedPricePerQtl: number;
  grossRevenue: number;
  estimatedTransportCost: number;
  estimatedHandlingFee: number;
  estimatedSpoilageCost: number;
  estimatedNetRealization: number;
  estimatedNetPerQtl: number;
  distanceKm: number;
}

export interface ComparativeDecision {
  recommendedChannel: 'BUYER' | 'MANDI';
  lotId: string;
  lotCommodity: string;
  lotQuantityQtl: number;
  bestBuyerMatch: BuyerMatchResult | null;
  bestMandi: {
    mandiName: string;
    district: string;
    modalPricePerQtl: number;
    grossRevenue: number;
    estimatedLogisticsCost: number;
    estimatedNetRealization: number;
    estimatedNetPerQtl: number;
    distanceKm: number;
  } | null;
  takeHomeDifference: number; // Profit delta in Rupees
  recommendationExplanation: string;
}

/** Simple district distance lookup table in KM */
const DISTRICT_DISTANCES: Record<string, Record<string, number>> = {
  Nashik: { Nashik: 20, 'Navi Mumbai': 185, Mumbai: 190, Pune: 210, Satara: 310, Solapur: 390, Ahmednagar: 160 },
  'Navi Mumbai': { Nashik: 185, 'Navi Mumbai': 15, Mumbai: 25, Pune: 145, Satara: 220, Solapur: 380, Ahmednagar: 250 },
  Pune: { Nashik: 210, 'Navi Mumbai': 145, Mumbai: 150, Pune: 15, Satara: 110, Solapur: 240, Ahmednagar: 120 },
  Satara: { Nashik: 310, 'Navi Mumbai': 220, Mumbai: 225, Pune: 110, Satara: 15, Solapur: 210, Ahmednagar: 200 },
  Solapur: { Nashik: 390, 'Navi Mumbai': 380, Mumbai: 385, Pune: 240, Satara: 210, Solapur: 20, Ahmednagar: 220 },
  Ahmednagar: { Nashik: 160, 'Navi Mumbai': 250, Mumbai: 255, Pune: 120, Satara: 200, Solapur: 220, Ahmednagar: 15 },
};

function getApproxDistance(fromDistrict: string, toDistrict: string): number {
  const normFrom = Object.keys(DISTRICT_DISTANCES).find(k => k.toLowerCase() === fromDistrict?.toLowerCase()) || 'Nashik';
  const normTo = Object.keys(DISTRICT_DISTANCES).find(k => k.toLowerCase() === toDistrict?.toLowerCase()) || 'Nashik';
  return DISTRICT_DISTANCES[normFrom]?.[normTo] || 150;
}

export async function computeBuyerMatchesForLot(lot: ILot): Promise<ComparativeDecision> {
  const activeDemands = await BuyerDemand.find({ demandStatus: 'ACTIVE' });
  const buyerIds = [...new Set(activeDemands.map((d) => d.buyerId))];
  const buyers = await Buyer.find({ buyerId: { $in: buyerIds } });
  const buyersMap = new Map<string, IBuyer>();
  buyers.forEach((b) => buyersMap.set(b.buyerId, b));

  const lotOriginDistrict = lot.district || 'Nashik';
  const matches: BuyerMatchResult[] = [];

  for (const demand of activeDemands) {
    const buyer = buyersMap.get(demand.buyerId);
    if (!buyer) continue;

    // 1. Crop Match (30 pts)
    const cropMatchNorm = lot.cropName.toLowerCase().trim();
    const demandCropNorm = demand.commodity.toLowerCase().trim();
    const isCropMatch = cropMatchNorm.includes(demandCropNorm) || demandCropNorm.includes(cropMatchNorm);
    if (!isCropMatch) continue; // Must match crop to be considered

    const cropScore = 30;
    const reasons: string[] = [`✓ Commodity matches ${demand.commodity}`];
    const warnings: string[] = [];

    // 2. Grade Match (20 pts)
    let gradeScore = 0;
    const lotGrade = (lot.grade || 'Grade A').toUpperCase();
    const reqGrade = (demand.requiredGrade || 'Grade A').toUpperCase();
    if (lotGrade === reqGrade || buyer.preferredGrades.some(g => g.toUpperCase() === lotGrade)) {
      gradeScore = 20;
      reasons.push(`✓ Quality grade ${lot.grade} matches buyer requirement (${demand.requiredGrade})`);
    } else if (lotGrade.includes('A') && reqGrade.includes('B')) {
      gradeScore = 18;
      reasons.push(`✓ Premium grade ${lot.grade} exceeds minimum grade ${demand.requiredGrade}`);
    } else {
      gradeScore = 8;
      warnings.push(`⚠ Grade difference: Lot is ${lot.grade}, buyer specifies ${demand.requiredGrade}`);
    }

    // 3. Quantity Compatibility (20 pts)
    let quantityScore = 0;
    const qty = lot.quantityQtl;
    if (qty >= demand.minQuantityQtl && qty <= demand.maxQuantityQtl) {
      quantityScore = 20;
      reasons.push(`✓ Quantity (${qty} Qtl) fits buyer requirement range (${demand.minQuantityQtl}–${demand.maxQuantityQtl} Qtl)`);
    } else if (qty < demand.minQuantityQtl) {
      const diff = demand.minQuantityQtl - qty;
      quantityScore = Math.max(5, Math.round(20 - diff * 0.5));
      warnings.push(`⚠ Lot quantity (${qty} Qtl) is below buyer minimum requirement (${demand.minQuantityQtl} Qtl)`);
    } else {
      quantityScore = 12;
      warnings.push(`⚠ Lot quantity (${qty} Qtl) exceeds buyer single-order max (${demand.maxQuantityQtl} Qtl)`);
    }

    // 4. Target Price Compatibility (15 pts)
    let priceScore = 0;
    const quotedPrice = Math.min(demand.targetPriceMax, Math.max(demand.targetPriceMin, lot.expectedPricePerQtl));
    if (quotedPrice >= lot.minimumAcceptablePrice) {
      priceScore = 15;
      reasons.push(`✓ Quoted target price (₹${quotedPrice}/Qtl) meets farmer minimum acceptable price (₹${lot.minimumAcceptablePrice}/Qtl)`);
    } else {
      priceScore = 6;
      warnings.push(`⚠ Buyer maximum price (₹${demand.targetPriceMax}/Qtl) is below farmer min expectation (₹${lot.minimumAcceptablePrice}/Qtl)`);
    }

    // 5. Location / Logistics (10 pts)
    let locationScore = 0;
    const distKm = getApproxDistance(lotOriginDistrict, buyer.district);
    if (distKm <= 30) {
      locationScore = 10;
      reasons.push(`✓ Nearby buyer location (${buyer.district}, ~${distKm} km)`);
    } else if (distKm <= 150) {
      locationScore = 7;
      reasons.push(`✓ Regional transit distance (${buyer.district}, ~${distKm} km)`);
    } else {
      locationScore = 4;
      warnings.push(`⚠ Long transit distance to buyer (${buyer.district}, ~${distKm} km)`);
    }

    // 6. Variety Match (5 pts)
    let varietyScore = 5;
    if (lot.variety && demand.variety && lot.variety !== 'Standard') {
      if (lot.variety.toLowerCase().includes(demand.variety.toLowerCase())) {
        reasons.push(`✓ Crop variety (${lot.variety}) matches demand spec`);
      }
    }

    const totalMatchScore = cropScore + gradeScore + quantityScore + priceScore + locationScore + varietyScore;

    // Calculate Net Realization for Buyer Option
    const grossRevenue = Math.round(quotedPrice * qty);
    // Direct buyer delivery rate (₹1.35/km/Qtl)
    const estimatedTransportCost = Math.round(distKm * 1.35 * qty);
    const estimatedHandlingFee = Math.round(grossRevenue * 0.005); // 0.5% handling
    const estimatedSpoilageCost = Math.round(grossRevenue * 0.015); // 1.5% spoilage direct
    const estimatedNetRealization = grossRevenue - estimatedTransportCost - estimatedHandlingFee - estimatedSpoilageCost;
    const estimatedNetPerQtl = Math.round(estimatedNetRealization / qty);

    matches.push({
      buyer: {
        buyerId: buyer.buyerId,
        businessName: buyer.businessName,
        buyerType: buyer.buyerType,
        location: buyer.location,
        district: buyer.district,
        verificationStatus: buyer.verificationStatus,
        isDemo: buyer.isDemo,
        contactPhone: buyer.contactPhone,
        contactEmail: buyer.contactEmail,
      },
      demand: {
        demandId: (demand._id as any).toString(),
        commodity: demand.commodity,
        variety: demand.variety,
        requiredGrade: demand.requiredGrade,
        minQuantityQtl: demand.minQuantityQtl,
        maxQuantityQtl: demand.maxQuantityQtl,
        targetPriceMin: demand.targetPriceMin,
        targetPriceMax: demand.targetPriceMax,
        deliveryLocation: demand.deliveryLocation,
      },
      matchScore: totalMatchScore,
      scoringBreakdown: {
        cropScore,
        gradeScore,
        quantityScore,
        priceScore,
        locationScore,
        varietyScore,
      },
      reasons,
      warnings,
      quotedPricePerQtl: quotedPrice,
      grossRevenue,
      estimatedTransportCost,
      estimatedHandlingFee,
      estimatedSpoilageCost,
      estimatedNetRealization,
      estimatedNetPerQtl,
      distanceKm: distKm,
    });
  }

  // Sort matches by Net Realization descending
  matches.sort((a, b) => b.estimatedNetRealization - a.estimatedNetRealization);

  const bestBuyerMatch = matches.length > 0 ? matches[0] : null;

  // Compute Best Mandi Realization for comparison
  let bestMandi = null;
  const rawCrop = (lot.cropName || '').trim();
  const cleanCrop = rawCrop
    .replace(/_\d+$/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(red|yellow|white|sharbati|hard|green|fresh|hybrid)\s+/i, '')
    .trim();

  const mandiPrices = await Price.find({
    $or: [
      { commodity: new RegExp(cleanCrop, 'i') },
      { commodity: new RegExp(rawCrop, 'i') }
    ],
    validationStatus: { $ne: 'INVALID' }
  }).populate('marketId');

  if (mandiPrices.length > 0) {
    let topMandiNet = -Infinity;
    for (const p of mandiPrices) {
      const market: any = p.marketId;
      if (!market) continue;
      const mPricePerKg = p.modalPrice > 100 ? p.modalPrice / 100 : p.modalPrice;
      const modalPricePerQtl = mPricePerKg * 100;
      const mGross = Math.round(modalPricePerQtl * lot.quantityQtl);
      const mDistKm = getApproxDistance(lotOriginDistrict, market.district || 'Nashik');
      const mTransport = Math.round(mDistKm * 1.5 * lot.quantityQtl);
      const mLabour = Math.round(500 * Math.max(1, Math.ceil(lot.quantityQtl / 30)));
      const mSpoilage = Math.round(mGross * 0.08); // 8% standard mandi spoilage
      const mCommission = Math.round(mGross * 0.01); // 1% APMC fees
      const mLogistics = mTransport + mLabour + mSpoilage + mCommission;
      const mNet = mGross - mLogistics;

      if (mNet > topMandiNet) {
        topMandiNet = mNet;
        bestMandi = {
          mandiName: market.name,
          district: market.district || 'Nashik',
          modalPricePerQtl,
          grossRevenue: mGross,
          estimatedLogisticsCost: mLogistics,
          estimatedNetRealization: mNet,
          estimatedNetPerQtl: Math.round(mNet / lot.quantityQtl),
          distanceKm: mDistKm,
        };
      }
    }
  }

  // Final Channel Recommendation logic
  let recommendedChannel: 'BUYER' | 'MANDI' = 'BUYER';
  let takeHomeDifference = 0;
  let recommendationExplanation = '';

  if (bestBuyerMatch && bestMandi) {
    const diff = bestBuyerMatch.estimatedNetRealization - bestMandi.estimatedNetRealization;
    takeHomeDifference = Math.abs(diff);
    if (diff >= 0) {
      recommendedChannel = 'BUYER';
      recommendationExplanation = `Selling to ${bestBuyerMatch.buyer.businessName} yields ₹${takeHomeDifference.toLocaleString('en-IN')} higher net take-home pay than ${bestMandi.mandiName} due to reduced transit handling and direct delivery terms.`;
    } else {
      recommendedChannel = 'MANDI';
      recommendationExplanation = `Selling at ${bestMandi.mandiName} yields ₹${takeHomeDifference.toLocaleString('en-IN')} higher net realization than buyer options due to competitive APMC auction demand.`;
    }
  } else if (bestBuyerMatch) {
    recommendedChannel = 'BUYER';
    recommendationExplanation = `Selling to ${bestBuyerMatch.buyer.businessName} provides an estimated net realization of ₹${bestBuyerMatch.estimatedNetRealization.toLocaleString('en-IN')}.`;
  } else if (bestMandi) {
    recommendedChannel = 'MANDI';
    recommendationExplanation = `Top APMC Mandi (${bestMandi.mandiName}) offers an estimated net realization of ₹${bestMandi.estimatedNetRealization.toLocaleString('en-IN')}. No matching demo buyer demands were found.`;
  } else {
    recommendationExplanation = 'No active buyer demands or mandi benchmark records were found for this lot.';
  }

  return {
    recommendedChannel,
    lotId: lot.lotId,
    lotCommodity: lot.cropName,
    lotQuantityQtl: lot.quantityQtl,
    bestBuyerMatch,
    bestMandi,
    takeHomeDifference,
    recommendationExplanation,
  };
}
