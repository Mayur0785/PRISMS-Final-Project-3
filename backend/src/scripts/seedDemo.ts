import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { Buyer } from '../modules/buyers/buyer.model';
import { Lot } from '../modules/lots/lot.model';
import { Offer } from '../modules/offers/offer.model';
import { Market } from '../modules/markets/market.model';
import { Price } from '../modules/prices/price.model';
import { getRankedMarkets } from '../modules/markets/ranking.service';

/**
 * Researched Pune-Region Benchmark Dataset (24 Aug 2026 Basis)
 * Primary Source: AGMARKNET / Data.gov.in
 */
export const PUNE_DEMO_MARKETS = [
  // Pune Region Showcase APMCs
  {
    name: 'Pune APMC (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.8567, 18.5204] }
  },
  {
    name: 'Pune(Pimpri) APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.8000, 18.6200] }
  },
  {
    name: 'Pune(Khadki) APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Soybeans'],
    location: { type: 'Point', coordinates: [73.8509, 18.5626] }
  },
  {
    name: 'Shirur APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Wheat', 'Red Onion', 'Onion', 'Tomato', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [74.3789, 18.8286] }
  },
  // Nashik Region Supporting APMCs
  {
    name: 'Lasalgaon Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Soybeans'],
    location: { type: 'Point', coordinates: [74.2255, 20.1418] }
  },
  {
    name: 'Pimpalgaon Baswant APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Soybeans'],
    location: { type: 'Point', coordinates: [73.9800, 20.1700] }
  },
  {
    name: 'Nashik Main APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Potato', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.7898, 19.9975] }
  },
  {
    name: 'Latur APMC',
    state: 'Maharashtra',
    district: 'Latur',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Soybeans'],
    location: { type: 'Point', coordinates: [76.5604, 18.4088] }
  },
  {
    name: 'Udgir APMC',
    state: 'Maharashtra',
    district: 'Latur',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Soybeans'],
    location: { type: 'Point', coordinates: [76.7725, 18.3931] }
  },
  {
    name: 'Rahuri APMC',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Wheat', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [74.6500, 19.3900] }
  }
];

/**
 * Researched AGMARKNET observations (21-24 Aug 2026)
 */
export const RESEARCHED_PUNE_PRICES = [
  // Pune APMC (Gultekdi) - 24 Aug 2026
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Tomato', min: 400, modal: 700, max: 1000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Red Onion', min: 1000, modal: 2750, max: 4500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Onion', min: 1000, modal: 2750, max: 4500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Banana', min: 500, modal: 1200, max: 2000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Potato', min: 800, modal: 1200, max: 1500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Wheat', min: 2600, modal: 2700, max: 2850, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Soybeans', min: 4500, modal: 4800, max: 5100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune APMC (Gultekdi)', commodity: 'Cotton', min: 6500, modal: 6900, max: 7300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Pune(Pimpri) APMC - 23-24 Aug 2026
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Tomato', min: 1200, modal: 1500, max: 1800, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Red Onion', min: 1500, modal: 2500, max: 3500, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Onion', min: 1500, modal: 2500, max: 3500, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Potato', min: 900, modal: 1100, max: 1300, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Wheat', min: 2550, modal: 2650, max: 2800, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Soybeans', min: 4400, modal: 4750, max: 5050, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Cotton', min: 6400, modal: 6850, max: 7200, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Pune(Khadki) APMC - 21-24 Aug 2026
  { marketName: 'Pune(Khadki) APMC', commodity: 'Tomato', min: 700, modal: 1000, max: 1300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Red Onion', min: 700, modal: 1150, max: 1400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Onion', min: 700, modal: 1150, max: 1400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Potato', min: 800, modal: 1000, max: 1200, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Wheat', min: 2500, modal: 2616, max: 2750, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Soybeans', min: 4450, modal: 4700, max: 5000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Shirur APMC, Pune - 21 Aug 2026
  { marketName: 'Shirur APMC', commodity: 'Wheat', min: 2700, modal: 2750, max: 2800, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Red Onion', min: 1100, modal: 2200, max: 3100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Onion', min: 1100, modal: 2200, max: 3100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Tomato', min: 500, modal: 850, max: 1100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Soybeans', min: 4500, modal: 4850, max: 5200, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Cotton', min: 6600, modal: 7000, max: 7400, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Lasalgaon Mandi, Nashik - 24 Aug 2026
  { marketName: 'Lasalgaon Mandi', commodity: 'Tomato', min: 900, modal: 1350, max: 1700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Red Onion', min: 1200, modal: 2414, max: 3600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Onion', min: 1200, modal: 2414, max: 3600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Wheat', min: 2400, modal: 2550, max: 2700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Soybeans', min: 4600, modal: 4900, max: 5250, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Pimpalgaon Baswant APMC, Nashik - 24 Aug 2026
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Tomato', min: 1000, modal: 1400, max: 1800, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Red Onion', min: 1300, modal: 2450, max: 3500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Onion', min: 1300, modal: 2450, max: 3500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Soybeans', min: 4550, modal: 4850, max: 5150, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Nashik Main APMC, Nashik - 24 Aug 2026
  { marketName: 'Nashik Main APMC', commodity: 'Tomato', min: 800, modal: 1200, max: 1600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Red Onion', min: 1100, modal: 2350, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Onion', min: 1100, modal: 2350, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Soybeans', min: 4500, modal: 4800, max: 5100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Cotton', min: 6500, modal: 6950, max: 7350, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Latur APMC, Latur - 24 Aug 2026
  { marketName: 'Latur APMC', commodity: 'Tomato', min: 1100, modal: 1650, max: 2000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Red Onion', min: 1400, modal: 2600, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Onion', min: 1400, modal: 2600, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Soybeans', min: 4700, modal: 5050, max: 5400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Udgir APMC, Latur - 24 Aug 2026
  { marketName: 'Udgir APMC', commodity: 'Tomato', min: 900, modal: 1300, max: 1700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Red Onion', min: 1200, modal: 2200, max: 3100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Soybeans', min: 4650, modal: 4950, max: 5300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Rahuri APMC, Ahmednagar - 24 Aug 2026
  { marketName: 'Rahuri APMC', commodity: 'Tomato', min: 800, modal: 1250, max: 1600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Red Onion', min: 1100, modal: 2300, max: 3200, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Soybeans', min: 4500, modal: 4800, max: 5100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Cotton', min: 6550, modal: 6900, max: 7300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
];

export const seedDemo = async () => {
  try {
    console.log('Connecting to MongoDB for Pune Demo Seed...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected');

    // 1. Seed Markets
    await Market.deleteMany({ state: 'Maharashtra' });
    await Price.deleteMany({});
    
    const insertedMarkets = await Market.insertMany(PUNE_DEMO_MARKETS);
    console.log(`✅ Seeded ${insertedMarkets.length} Pune-region APMCs.`);

    // 2. Insert Researched Price Records
    const priceDocs = [];
    for (const record of RESEARCHED_PUNE_PRICES) {
      const market = insertedMarkets.find((m) => m.name === record.marketName);
      if (!market) continue;

      priceDocs.push({
        marketId: market._id,
        commodity: record.commodity,
        minPrice: record.min,
        maxPrice: record.max,
        modalPrice: record.modal,
        arrivalVolume: 320,
        validationStatus: 'VALIDATED',
        isDemo: true,
        source: record.source,
        date: new Date(record.date),
      });
    }
    await Price.insertMany(priceDocs);
    console.log(`✅ Seeded ${priceDocs.length} researched Pune mandi price records.`);

    // 3. Seed Primary Demo Farmer: Mayur Kapse (Pimple Gurav, Pune)
    let farmer = await User.findOne({ email: 'farmer.lasalgaon@prisms.gov.in' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Mayur Kapse',
        email: 'farmer.lasalgaon@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'farmer',
        phone: '9876543210',
        village: 'Pimple Gurav',
        district: 'Pune',
        landholdingAcres: 4.5,
      });
    } else {
      farmer.name = 'Mayur Kapse';
      farmer.village = 'Pimple Gurav';
      farmer.district = 'Pune';
      await farmer.save();
    }
    console.log(`✅ Demo Farmer configured: ${farmer.name} (${farmer.village}, ${farmer.district})`);

    // 4. Seed Primary Demo Buyer: Nashik Agro Processors Ltd. (Pune Receiving Hub)
    let buyerUser = await User.findOne({ email: 'buyer.nashik@prisms.gov.in' });
    if (!buyerUser) {
      buyerUser = await User.create({
        name: 'Nashik Agro Processors Ltd.',
        email: 'buyer.nashik@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: '9876543220',
        village: 'Chakan',
        district: 'Pune',
      });
    }

    let buyerProfile = await Buyer.findOne({ buyerId: 'DEMO-BUYER-01' });
    if (!buyerProfile) {
      buyerProfile = await Buyer.create({
        buyerId: 'DEMO-BUYER-01',
        businessName: 'Nashik Agro Processors Ltd.',
        buyerType: 'Processor',
        contactPhone: '9876543220',
        contactEmail: 'buyer.nashik@prisms.gov.in',
        location: 'Chakan Agro Hub, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        verificationStatus: 'VERIFIED',
        cropsInterested: ['Tomato', 'Red Onion', 'Wheat'],
        preferredGrades: ['Grade A', 'Grade B'],
        minQuantityQtl: 10,
        maxQuantityQtl: 500,
        targetPriceMin: 1000,
        targetPriceMax: 3000,
        deliveryPreference: 'Buyer Pickup',
        paymentTerms: 'T+1 Escrow',
        isDemo: true,
      });
    }

    // 5. Seed Controlled Trade Lots for Mayur Kapse (Pimple Gurav, Pune)
    await Lot.deleteMany({
      $or: [
        { userId: { $in: [farmer._id, String(farmer._id)] } },
        { lotId: { $in: ['LOT-2026-0073', 'LOT-2026-99F5', 'LOT-2026-0072'] } }
      ]
    });

    // Primary Showcase Lot 1: Tomato (30 Qtl, Pimple Gurav, Pune)
    const lotTomato = await Lot.create({
      lotId: 'LOT-2026-0073',
      userId: farmer._id,
      cropName: 'Tomato',
      variety: 'Sona Premium',
      grade: 'Grade A',
      quantityQtl: 30,
      expectedPricePerQtl: 1500,
      minimumAcceptablePrice: 1350,
      qualityScore: 88,
      origin: 'Pimple Gurav, Pune',
      district: 'Pune',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    // Showcase Lot 2: Red Onion (50 Qtl, Pimple Gurav, Pune)
    const lotOnion = await Lot.create({
      lotId: 'LOT-2026-99F5',
      userId: farmer._id,
      cropName: 'Red Onion',
      variety: 'Garwa Quality',
      grade: 'Grade A',
      quantityQtl: 50,
      expectedPricePerQtl: 2750,
      minimumAcceptablePrice: 2500,
      qualityScore: 90,
      origin: 'Pimple Gurav, Pune',
      district: 'Pune',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    // Showcase Lot 3: Wheat (40 Qtl, Pimple Gurav, Pune)
    const lotWheat = await Lot.create({
      lotId: 'LOT-2026-0072',
      userId: farmer._id,
      cropName: 'Wheat',
      variety: 'Lokwan',
      grade: 'Grade A',
      quantityQtl: 40,
      expectedPricePerQtl: 2700,
      minimumAcceptablePrice: 2600,
      qualityScore: 91,
      origin: 'Pimple Gurav, Pune',
      district: 'Pune',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    console.log(`✅ Seeded 3 Pune Demo Trade Lots: ${lotTomato.lotId}, ${lotOnion.lotId}, ${lotWheat.lotId}`);

    // 6. Seed Initial Buyer Offer for Primary Tomato Lot (LOT-2026-0073)
    await Offer.deleteMany({});

    const grossVal = 1500 * 30; // ₹45,000
    const transCost = Math.round(7.2 * 1.5 * 30); // ~₹324 (7.2 km from Pimple Gurav to Pune(Pimpri) APMC)
    const labourCost = 500;
    const spoilageCost = Math.round(grossVal * 0.05); // 5% = ₹2,250
    const handlingCost = Math.round(grossVal * 0.01); // 1% = ₹450
    const netRealization = grossVal - transCost - labourCost - spoilageCost - handlingCost; // ₹41,476

    const offerTomato = await Offer.create({
      offerId: 'OFFER-DEMO-0073',
      lotId: lotTomato._id,
      sellerUserId: farmer._id,
      buyerId: String(buyerUser._id),
      commodity: 'Tomato',
      variety: 'Sona Premium',
      grade: 'Grade A',
      quantityQtl: 30,
      pricePerQtl: 1500,
      grossValue: grossVal,
      estimatedTransportCost: transCost,
      estimatedLabourCost: labourCost,
      estimatedSpoilage: spoilageCost,
      estimatedMarketHandlingCharges: handlingCost,
      estimatedNetRealization: netRealization,
      paymentTerms: '100% Bank Escrow (T+1)',
      deliveryTerms: 'Buyer Pickup',
      pickupLocation: 'Pimple Gurav, Pune',
      deliveryLocation: 'Chakan Agro Hub, Pune',
      expiresAt: new Date(Date.now() + 48 * 3600000),
      offerStatus: 'PENDING',
      isDemo: true,
    });

    console.log(`✅ Seeded Tomato Showcase Offer: ${offerTomato.offerId} (₹1,500/Qtl, Net ₹${netRealization})`);
    console.log('🎉 Pune Demo Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Pune Demo Seed Error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDemo();
}
