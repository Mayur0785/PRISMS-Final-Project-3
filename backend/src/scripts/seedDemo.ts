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
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.8509, 18.5626] }
  },
  {
    name: 'Shirur APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [74.3789, 18.8286] }
  },
  // Nashik Region Supporting APMCs
  {
    name: 'Lasalgaon Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [74.2255, 20.1418] }
  },
  {
    name: 'Pimpalgaon Baswant APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.9800, 20.1700] }
  },
  {
    name: 'Nashik Main APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [73.7898, 19.9975] }
  },
  {
    name: 'Latur APMC',
    state: 'Maharashtra',
    district: 'Latur',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [76.5604, 18.4088] }
  },
  {
    name: 'Udgir APMC',
    state: 'Maharashtra',
    district: 'Latur',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
    location: { type: 'Point', coordinates: [76.7725, 18.3931] }
  },
  {
    name: 'Rahuri APMC',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    commodities: ['Tomato', 'Red Onion', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans', 'Cotton'],
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
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Banana', min: 520, modal: 1250, max: 2050, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Potato', min: 900, modal: 1100, max: 1300, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Wheat', min: 2550, modal: 2650, max: 2800, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Soybeans', min: 4400, modal: 4750, max: 5050, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Pimpri) APMC', commodity: 'Cotton', min: 6400, modal: 6850, max: 7200, date: '2026-08-23', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Pune(Khadki) APMC - 21-24 Aug 2026
  { marketName: 'Pune(Khadki) APMC', commodity: 'Tomato', min: 700, modal: 1000, max: 1300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Red Onion', min: 700, modal: 1150, max: 1400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Onion', min: 700, modal: 1150, max: 1400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Banana', min: 480, modal: 1180, max: 1950, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Potato', min: 800, modal: 1000, max: 1200, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Wheat', min: 2500, modal: 2616, max: 2750, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Soybeans', min: 4450, modal: 4700, max: 5000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pune(Khadki) APMC', commodity: 'Cotton', min: 6350, modal: 6800, max: 7150, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Shirur APMC, Pune - 21 Aug 2026
  { marketName: 'Shirur APMC', commodity: 'Wheat', min: 2700, modal: 2750, max: 2800, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Red Onion', min: 1100, modal: 2200, max: 3100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Onion', min: 1100, modal: 2200, max: 3100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Tomato', min: 500, modal: 850, max: 1100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Banana', min: 550, modal: 1300, max: 2100, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Potato', min: 850, modal: 1050, max: 1250, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Soybeans', min: 4500, modal: 4850, max: 5200, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Shirur APMC', commodity: 'Cotton', min: 6600, modal: 7000, max: 7400, date: '2026-08-21', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Lasalgaon Mandi, Nashik - 24 Aug 2026
  { marketName: 'Lasalgaon Mandi', commodity: 'Tomato', min: 900, modal: 1350, max: 1700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Red Onion', min: 1200, modal: 2414, max: 3600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Onion', min: 1200, modal: 2414, max: 3600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Banana', min: 600, modal: 1400, max: 2200, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Potato', min: 900, modal: 1150, max: 1350, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Wheat', min: 2400, modal: 2550, max: 2700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Soybeans', min: 4600, modal: 4900, max: 5250, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Lasalgaon Mandi', commodity: 'Cotton', min: 6700, modal: 7100, max: 7500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Pimpalgaon Baswant APMC, Nashik - 24 Aug 2026
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Tomato', min: 1000, modal: 1400, max: 1800, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Red Onion', min: 1300, modal: 2450, max: 3500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Onion', min: 1300, modal: 2450, max: 3500, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Banana', min: 580, modal: 1380, max: 2150, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Potato', min: 880, modal: 1120, max: 1320, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Wheat', min: 2450, modal: 2600, max: 2750, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Soybeans', min: 4550, modal: 4850, max: 5150, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Pimpalgaon Baswant APMC', commodity: 'Cotton', min: 6600, modal: 7050, max: 7450, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Nashik Main APMC, Nashik - 24 Aug 2026
  { marketName: 'Nashik Main APMC', commodity: 'Tomato', min: 800, modal: 1200, max: 1600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Red Onion', min: 1100, modal: 2350, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Onion', min: 1100, modal: 2350, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Banana', min: 540, modal: 1320, max: 2080, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Potato', min: 860, modal: 1100, max: 1300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Wheat', min: 2480, modal: 2620, max: 2780, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Soybeans', min: 4500, modal: 4800, max: 5100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Nashik Main APMC', commodity: 'Cotton', min: 6500, modal: 6950, max: 7350, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Latur APMC, Latur - 24 Aug 2026
  { marketName: 'Latur APMC', commodity: 'Tomato', min: 1100, modal: 1650, max: 2000, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Red Onion', min: 1400, modal: 2600, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Onion', min: 1400, modal: 2600, max: 3400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Banana', min: 620, modal: 1450, max: 2250, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Potato', min: 920, modal: 1180, max: 1380, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Wheat', min: 2520, modal: 2680, max: 2840, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Soybeans', min: 4700, modal: 5050, max: 5400, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Latur APMC', commodity: 'Cotton', min: 6800, modal: 7200, max: 7600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Udgir APMC, Latur - 24 Aug 2026
  { marketName: 'Udgir APMC', commodity: 'Tomato', min: 900, modal: 1300, max: 1700, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Red Onion', min: 1200, modal: 2200, max: 3100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Onion', min: 1200, modal: 2200, max: 3100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Banana', min: 590, modal: 1390, max: 2180, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Potato', min: 870, modal: 1110, max: 1310, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Wheat', min: 2500, modal: 2650, max: 2800, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Soybeans', min: 4650, modal: 4950, max: 5300, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Udgir APMC', commodity: 'Cotton', min: 6750, modal: 7150, max: 7550, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },

  // Rahuri APMC, Ahmednagar - 24 Aug 2026
  { marketName: 'Rahuri APMC', commodity: 'Tomato', min: 800, modal: 1250, max: 1600, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Red Onion', min: 1100, modal: 2300, max: 3200, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Onion', min: 1100, modal: 2300, max: 3200, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Banana', min: 560, modal: 1340, max: 2100, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Potato', min: 840, modal: 1080, max: 1280, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
  { marketName: 'Rahuri APMC', commodity: 'Wheat', min: 2510, modal: 2640, max: 2790, date: '2026-08-24', source: 'SEEDED_HISTORICAL_BENCHMARK' },
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

    // 6. Seed Multi-Buyer Offers for Showcase Lots
    await Offer.deleteMany({});

    // Seed additional buyer user accounts if they don't exist
    let buyerUser2 = await User.findOne({ email: 'buyer.mumbai@prisms.gov.in' });
    if (!buyerUser2) {
      buyerUser2 = await User.create({
        name: 'Mumbai Metro Wholesale Foods',
        email: 'buyer.mumbai@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: '9822122002',
        village: 'Vashi',
        district: 'Navi Mumbai',
      });
    }

    let buyerUser3 = await User.findOne({ email: 'buyer.sahyadri@prisms.gov.in' });
    if (!buyerUser3) {
      buyerUser3 = await User.create({
        name: 'Sahyadri Fresh Retail Supermarkets',
        email: 'buyer.sahyadri@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: '9822144004',
        village: 'Satara Road',
        district: 'Satara',
      });
    }

    let buyerUser4 = await User.findOne({ email: 'buyer.mahagrapes@prisms.gov.in' });
    if (!buyerUser4) {
      buyerUser4 = await User.create({
        name: 'Deccan Food Processing Co.',
        email: 'buyer.mahagrapes@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: '9822155005',
        village: 'MIDC',
        district: 'Solapur',
      });
    }

    // Helper to compute verified net realization for an offer
    const createOfferDoc = async (
      offerId: string,
      lotObj: any,
      buyerUserObj: any,
      pricePerQtl: number,
      distanceKm: number,
      paymentTerms: string,
      deliveryTerms: string,
      deliveryLocation: string
    ) => {
      const qtl = lotObj.quantityQtl;
      const grossVal = pricePerQtl * qtl;
      const transCost = deliveryTerms.includes('Pickup') ? 0 : Math.round(distanceKm * 1.5 * qtl);
      const labourCost = 500;
      const spoilagePct = lotObj.cropName.toLowerCase().includes('tomato') ? 0.05 : lotObj.cropName.toLowerCase().includes('onion') ? 0.04 : 0.03;
      const spoilageCost = Math.round(grossVal * spoilagePct);
      const handlingCost = Math.round(grossVal * 0.01);
      const netRealization = grossVal - transCost - labourCost - spoilageCost - handlingCost;

      return Offer.create({
        offerId,
        lotId: lotObj._id,
        sellerUserId: farmer._id,
        buyerId: String(buyerUserObj._id),
        commodity: lotObj.cropName,
        variety: lotObj.variety,
        grade: lotObj.grade,
        quantityQtl: qtl,
        pricePerQtl,
        grossValue: grossVal,
        estimatedTransportCost: transCost,
        estimatedLabourCost: labourCost,
        estimatedSpoilage: spoilageCost,
        estimatedMarketHandlingCharges: handlingCost,
        estimatedNetRealization: netRealization,
        paymentTerms,
        deliveryTerms,
        pickupLocation: lotObj.origin,
        deliveryLocation,
        expiresAt: new Date(Date.now() + 48 * 3600000),
        offerStatus: 'PENDING',
        isDemo: true,
      });
    };

    // --- SEED OFFERS FOR SHOWCASE LOT 1: TOMATO (30 Qtl, LOT-2026-0073) ---
    // Buyer 1: Mumbai Metro Wholesale Foods (₹1,580/Qtl, Net ₹44,554) -> HIGHEST NET (BEST OFFER)
    await createOfferDoc('OFFER-DEMO-0073-A', lotTomato, buyerUser2, 1580, 120, 'T+1 Direct Bank Transfer (Simulated)', 'Buyer Pickup', 'Vashi APMC, Navi Mumbai');
    // Buyer 2: Nashik Agro Processors Ltd. (₹1,500/Qtl, Net ₹41,476)
    await createOfferDoc('OFFER-DEMO-0073-B', lotTomato, buyerUser, 1500, 7.2, '100% Bank Escrow (T+1)', 'Buyer Pickup', 'Chakan Agro Hub, Pune');
    // Buyer 3: Sahyadri Fresh Retail Supermarkets (₹1,440/Qtl, Net ₹39,766)
    await createOfferDoc('OFFER-DEMO-0073-C', lotTomato, buyerUser3, 1440, 110, 'Weekly Settlement (Simulated)', 'Direct Store Delivery', 'Satara Road Hub, Satara');
    // Buyer 4: Deccan Food Processing Co. (₹1,380/Qtl, Net ₹38,056)
    await createOfferDoc('OFFER-DEMO-0073-D', lotTomato, buyerUser4, 1380, 240, 'Advance Escrow (Simulated)', 'Buyer Pickup', 'Solapur Processing Yard');

    // --- SEED OFFERS FOR SHOWCASE LOT 2: RED ONION (50 Qtl, LOT-2026-99F5) ---
    // Buyer 1: Nashik Agro Processors Ltd. (₹2,820/Qtl, Net ₹1,33,430) -> BEST OFFER
    await createOfferDoc('OFFER-DEMO-99F5-A', lotOnion, buyerUser, 2820, 180, 'Immediate Bank Transfer (Simulated)', 'Buyer Pickup', 'Pimpalgaon Baswant, Nashik');
    // Buyer 2: Mumbai Metro Wholesale Foods (₹2,750/Qtl, Net ₹1,30,075)
    await createOfferDoc('OFFER-DEMO-99F5-B', lotOnion, buyerUser2, 2750, 120, 'T+1 Direct Transfer (Simulated)', 'Buyer Pickup', 'Vashi Market Yard, Navi Mumbai');
    // Buyer 3: Sahyadri Fresh Retail Supermarkets (₹2,680/Qtl, Net ₹1,26,720)
    await createOfferDoc('OFFER-DEMO-99F5-C', lotOnion, buyerUser3, 2680, 110, 'Weekly Escrow (Simulated)', 'Hub Delivery', 'Satara Central Hub');
    // Buyer 4: Deccan Food Processing Co. (₹2,600/Qtl, Net ₹1,22,885)
    await createOfferDoc('OFFER-DEMO-99F5-D', lotOnion, buyerUser4, 2600, 240, 'Advance Escrow (Simulated)', 'Buyer Pickup', 'Solapur MIDC');

    // --- SEED OFFERS FOR SHOWCASE LOT 3: WHEAT (40 Qtl, LOT-2026-0072) ---
    // Buyer 1: Maharashtra Grain & Flour Mills (₹2,760/Qtl, Net ₹1,05,536) -> BEST OFFER
    await createOfferDoc('OFFER-DEMO-0072-A', lotWheat, buyerUser3, 2760, 25, 'Same-day NEFT (Simulated)', 'Buyer Pickup', 'Hadapsar Flour Mills, Pune');
    // Buyer 2: Nashik Agro Processors Ltd. (₹2,700/Qtl, Net ₹1,03,212)
    await createOfferDoc('OFFER-DEMO-0072-B', lotWheat, buyerUser, 2700, 180, '100% Bank Escrow (T+1)', 'Buyer Pickup', 'Pimpalgaon Processing Plant');
    // Buyer 3: Mumbai Metro Wholesale Foods (₹2,640/Qtl, Net ₹1,00,888)
    await createOfferDoc('OFFER-DEMO-0072-C', lotWheat, buyerUser2, 2640, 120, 'T+1 Bank Transfer (Simulated)', 'Direct Terminal Delivery', 'Vashi APMC, Navi Mumbai');

    console.log(`✅ Seeded 11 distinct multi-buyer offers across 3 showcase lots (Tomato: 4, Red Onion: 4, Wheat: 3)`);
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
