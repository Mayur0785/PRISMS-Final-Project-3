import { Lot, ILot } from '../lots/lot.model';
import { Offer } from './offer.model';
import { User } from '../users/user.model';

export interface DemoBuyerPreset {
  email: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  deliveryLocation: string;
  paymentTerms: string;
  deliveryTerms: string;
  priceMultiplier: number;
  distanceKm: number;
}

const DEMO_BUYER_PRESETS: DemoBuyerPreset[] = [
  {
    email: 'buyer.mumbai@prisms.gov.in',
    name: 'Mumbai Metro Wholesale Foods',
    phone: '9822122002',
    village: 'Vashi',
    district: 'Navi Mumbai',
    deliveryLocation: 'Vashi APMC, Navi Mumbai',
    paymentTerms: 'T+1 Direct Bank Transfer (Simulated)',
    deliveryTerms: 'Buyer Pickup',
    priceMultiplier: 1.05, // Premium price, pickup
    distanceKm: 120,
  },
  {
    email: 'buyer.nashik@prisms.gov.in',
    name: 'Nashik Agro Processors Ltd.',
    phone: '9876543220',
    village: 'Chakan',
    district: 'Pune',
    deliveryLocation: 'Chakan Agro Hub, Pune',
    paymentTerms: '100% Bank Escrow (T+1)',
    deliveryTerms: 'Buyer Pickup',
    priceMultiplier: 1.02, // Moderate price, local pickup
    distanceKm: 15,
  },
  {
    email: 'buyer.sahyadri@prisms.gov.in',
    name: 'Sahyadri Fresh Retail Supermarkets',
    phone: '9822144004',
    village: 'Satara Road',
    district: 'Satara',
    deliveryLocation: 'Satara Road Hub, Satara',
    paymentTerms: 'Weekly Settlement (Simulated)',
    deliveryTerms: 'Direct Store Delivery',
    priceMultiplier: 0.98, // Slightly lower base price, direct delivery
    distanceKm: 110,
  },
  {
    email: 'buyer.mahagrapes@prisms.gov.in',
    name: 'Deccan Food Processing Co.',
    phone: '9822155005',
    village: 'MIDC',
    district: 'Solapur',
    deliveryLocation: 'Solapur Processing Yard',
    paymentTerms: 'Advance Escrow (Simulated)',
    deliveryTerms: 'Buyer Pickup',
    priceMultiplier: 0.95, // Bulk processing rate
    distanceKm: 240,
  },
];

/**
 * Creates 3-4 deterministic MongoDB-backed demo Buyer Offers for any given Trade Lot.
 * Idempotent: Checks buyerId + lotId before creating to prevent duplicates on refresh.
 */
export async function seedDemoOffersForLot(lot: ILot): Promise<number> {
  let createdCount = 0;
  const expPrice = lot.expectedPricePerQtl || 2500;
  const qtl = lot.quantityQtl || 30;

  for (let idx = 0; idx < DEMO_BUYER_PRESETS.length; idx++) {
    const preset = DEMO_BUYER_PRESETS[idx]!;

    // 1. Ensure Buyer User account exists
    let buyerUser = await User.findOne({ email: preset.email });
    if (!buyerUser) {
      buyerUser = await User.create({
        name: preset.name,
        email: preset.email,
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: preset.phone,
        village: preset.village,
        district: preset.district,
      });
    }

    const buyerIdStr = String(buyerUser._id);

    // 2. Idempotency Guard: check if an active offer already exists for this buyer + lot
    const existingOffer = await Offer.findOne({
      $or: [
        { lotId: lot._id },
        { lotId: String(lot._id) },
        { lotId: lot.lotId },
      ],
      buyerId: buyerIdStr,
    });

    if (existingOffer) {
      continue;
    }

    // 3. Deterministic calculation math
    const pricePerQtl = Math.round(expPrice * preset.priceMultiplier);
    const grossVal = pricePerQtl * qtl;
    const transCost = preset.deliveryTerms.includes('Pickup') ? 0 : Math.round(preset.distanceKm * 1.5 * qtl);
    const labourCost = 500;
    const cropLower = (lot.cropName || '').toLowerCase();
    const spoilagePct = cropLower.includes('tomato') ? 0.05 : cropLower.includes('onion') ? 0.04 : 0.03;
    const spoilageCost = Math.round(grossVal * spoilagePct);
    const handlingCost = Math.round(grossVal * 0.01);
    const netRealization = grossVal - transCost - labourCost - spoilageCost - handlingCost;

    // Stable deterministic offer ID
    const lotSuffix = (lot.lotId || String(lot._id)).replace(/[^a-zA-Z0-9]/g, '').slice(-4);
    const offerId = `OFFER-DEMO-${lotSuffix}-${idx + 1}`;

    await Offer.create({
      offerId,
      lotId: lot._id as any,
      sellerUserId: lot.userId,
      buyerId: buyerIdStr,
      commodity: lot.cropName,
      variety: lot.variety || 'Standard',
      grade: lot.grade || 'Grade A',
      quantityQtl: qtl,
      pricePerQtl,
      grossValue: grossVal,
      estimatedTransportCost: transCost,
      estimatedLabourCost: labourCost,
      estimatedSpoilage: spoilageCost,
      estimatedMarketHandlingCharges: handlingCost,
      estimatedNetRealization: netRealization,
      paymentTerms: preset.paymentTerms,
      deliveryTerms: preset.deliveryTerms,
      pickupLocation: lot.origin || 'Farm Gate',
      deliveryLocation: preset.deliveryLocation,
      expiresAt: new Date(Date.now() + 48 * 3600000),
      offerStatus: 'PENDING',
      isDemo: true,
    });

    createdCount++;
  }

  // Ensure lot status is set to OFFERED if offers exist
  if (lot.lotStatus === 'PUBLISHED' || lot.lotStatus === 'MATCHED') {
    lot.lotStatus = 'OFFERED';
    await lot.save();
  }

  return createdCount;
}
