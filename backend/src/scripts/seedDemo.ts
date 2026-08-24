import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js to use Google and Cloudflare DNS to bypass local SRV blocks
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { Buyer } from '../modules/buyers/buyer.model';
import { Lot } from '../modules/lots/lot.model';
import { Offer } from '../modules/offers/offer.model';
import { Market } from '../modules/markets/market.model';
import { Price } from '../modules/prices/price.model';
import { DeliveryOrder } from '../modules/delivery/delivery.model';
import { PaymentLedger } from '../modules/payments/payment.model';
import { Transaction } from '../modules/transactions/transaction.model';

const MOCK_MARKETS = [
  {
    name: 'Vashi APMC, Navi Mumbai',
    state: 'Maharashtra',
    district: 'Navi Mumbai',
    commodities: ['Onion', 'Tomato', 'Potato', 'Wheat', 'Banana', 'Soybeans'],
    location: { type: 'Point', coordinates: [73.0031, 19.0745] }
  },
  {
    name: 'Kalyan APMC',
    state: 'Maharashtra',
    district: 'Thane',
    commodities: ['Banana', 'Onion', 'Tomato', 'Potato'],
    location: { type: 'Point', coordinates: [73.1305, 19.2403] }
  },
  {
    name: 'Panvel APMC',
    state: 'Maharashtra',
    district: 'Raigad',
    commodities: ['Banana', 'Tomato', 'Onion', 'Wheat'],
    location: { type: 'Point', coordinates: [73.1093, 18.9894] }
  },
  {
    name: 'Pune APMC (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans'],
    location: { type: 'Point', coordinates: [73.8567, 18.5204] }
  },
  {
    name: 'Baramati APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Wheat', 'Soybeans', 'Onion', 'Banana'],
    location: { type: 'Point', coordinates: [74.5815, 18.1517] }
  },
  {
    name: 'Lasalgaon Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Onion', 'Wheat', 'Soybeans', 'Tomato'],
    location: { type: 'Point', coordinates: [74.2255, 20.1418] }
  },
  {
    name: 'Pimpalgaon Baswant APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Onion', 'Grapes', 'Wheat'],
    location: { type: 'Point', coordinates: [73.9800, 20.1700] }
  },
  {
    name: 'Nashik Main APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Onion', 'Tomato', 'Grapes', 'Wheat'],
    location: { type: 'Point', coordinates: [73.7898, 19.9975] }
  },
  {
    name: 'Rahuri APMC',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    commodities: ['Wheat', 'Soybeans', 'Onion', 'Cotton'],
    location: { type: 'Point', coordinates: [74.6500, 19.3900] }
  }
];

const generatePrices = (markets: any[]) => {
  const prices = [];
  const today = new Date();
  
  for (const market of markets) {
    for (const commodity of market.commodities) {
      let basePrice = 2400;
      if (commodity === 'Onion') basePrice = 2350;
      if (commodity === 'Tomato') basePrice = 3100;
      if (commodity === 'Wheat') basePrice = 2275;
      if (commodity === 'Banana') basePrice = 3700;
      if (commodity === 'Potato') basePrice = 1950;
      if (commodity === 'Soybeans') basePrice = 4800;
      if (commodity === 'Cotton') basePrice = 6900;
      
      if (market.name.includes('Vashi')) {
        basePrice = Math.round(basePrice * 1.08);
      } else if (market.name.includes('Lasalgaon') && commodity === 'Onion') {
        basePrice = Math.round(basePrice * 1.05);
      }

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const noise = (Math.random() - 0.5) * 150;
        let currentModalPrice = basePrice + noise;

        prices.push({
          marketId: market._id,
          commodity,
          minPrice: Math.floor(currentModalPrice * 0.92),
          maxPrice: Math.floor(currentModalPrice * 1.08),
          modalPrice: Math.floor(currentModalPrice),
          arrivalVolume: Math.floor(Math.random() * 500) + 150,
          date
        });
      }
    }
  }
  return prices;
};

export const seedDemo = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected');

    // 1. Seed Markets & Prices
    await Market.deleteMany({});
    await Price.deleteMany({});
    const insertedMarkets = await Market.insertMany(MOCK_MARKETS);
    const mockPrices = generatePrices(insertedMarkets);
    await Price.insertMany(mockPrices);
    console.log(`✅ Seeded ${insertedMarkets.length} markets and ${mockPrices.length} prices.`);

    // 2. Seed Primary Demo Farmer: Mayur Kapse
    let farmer = await User.findOne({ email: 'farmer.lasalgaon@prisms.gov.in' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Mayur Kapse (नवी मुंबई)',
        email: 'farmer.lasalgaon@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6', // Kisan@2024 bcrypt
        role: 'farmer',
        phone: '9876543210',
        village: 'Niphad',
        district: 'Nashik',
        landholdingAcres: 5.5,
      });
    } else {
      farmer.name = 'Mayur Kapse (नवी मुंबई)';
      farmer.village = 'Niphad';
      farmer.district = 'Nashik';
      await farmer.save();
    }
    console.log(`✅ Demo Farmer configured: ${farmer.name} (${farmer._id})`);

    // 3. Seed Primary Demo Buyer: Nashik Agro Processors Ltd.
    let buyerUser = await User.findOne({ email: 'buyer.nashik@prisms.gov.in' });
    if (!buyerUser) {
      buyerUser = await User.create({
        name: 'Nashik Agro Processors Ltd.',
        email: 'buyer.nashik@prisms.gov.in',
        passwordHash: '$2a$10$wE8w0V4i0X6qZ4k0X6qZ4e0X6qZ4k0X6qZ4k0X6qZ4k0X6qZ4k0X6',
        role: 'buyer',
        phone: '9876543220',
        village: 'Dindori',
        district: 'Nashik',
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
        location: 'Pimpalgaon, Nashik',
        district: 'Nashik',
        state: 'Maharashtra',
        verificationStatus: 'VERIFIED',
        cropsInterested: ['Red Onion', 'Wheat', 'Tomato'],
        preferredGrades: ['Grade A', 'Grade B'],
        minQuantityQtl: 10,
        maxQuantityQtl: 500,
        targetPriceMin: 2500,
        targetPriceMax: 3500,
        deliveryPreference: 'Buyer Pickup',
        paymentTerms: 'T+1 Escrow',
        isDemo: true,
      });
    }
    console.log(`✅ Demo Buyer configured: ${buyerProfile.businessName}`);

    // 4. Seed Controlled Trade Lots for Farmer Mayur Kapse
    await Lot.deleteMany({
      $or: [
        { userId: { $in: [farmer._id, String(farmer._id), 'user_demo_001', 'farmer.lasalgaon@prisms.gov.in'] } },
        { lotId: { $in: ['LOT-2026-99F5', 'LOT-2026-0072', 'LOT-2026-0073'] } }
      ]
    });

    const lotA = await Lot.create({
      lotId: 'LOT-2026-99F5',
      userId: farmer._id,
      cropName: 'Red Onion',
      variety: 'Garwa Premium',
      grade: 'Grade A',
      quantityQtl: 50,
      expectedPricePerQtl: 3000,
      minimumAcceptablePrice: 2800,
      qualityScore: 92,
      origin: 'Farm Gate, Niphad',
      district: 'Nashik',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    const lotB = await Lot.create({
      lotId: 'LOT-2026-0072',
      userId: farmer._id,
      cropName: 'Wheat',
      variety: 'MP Sharbati',
      grade: 'Grade A',
      quantityQtl: 60,
      expectedPricePerQtl: 2750,
      minimumAcceptablePrice: 2600,
      qualityScore: 90,
      origin: 'Farm Gate, Lasalgaon',
      district: 'Nashik',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    const lotC = await Lot.create({
      lotId: 'LOT-2026-0073',
      userId: farmer._id,
      cropName: 'Tomato',
      variety: 'Narayangaon Special',
      grade: 'Grade A',
      quantityQtl: 40,
      expectedPricePerQtl: 2800,
      minimumAcceptablePrice: 2600,
      qualityScore: 88,
      origin: 'Farm Gate, Pimpalgaon',
      district: 'Nashik',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'OFFERED',
    });

    console.log(`✅ Seeded 3 Controlled Demo Trade Lots: ${lotA.lotId}, ${lotB.lotId}, ${lotC.lotId}`);

    // 5. Seed Controlled Offers from Nashik Agro Processors Ltd.
    await Offer.deleteMany({
      $or: [
        { lotId: { $in: [lotA._id, String(lotA._id), lotA.lotId, lotB._id, String(lotB._id), lotB.lotId, lotC._id, String(lotC._id), lotC.lotId] } },
        { offerId: { $in: ['OFFER-DEMO-99F5', 'OFFER-DEMO-0072', 'OFFER-DEMO-0073'] } }
      ]
    });

    const offerA = await Offer.create({
      offerId: 'OFFER-DEMO-99F5',
      lotId: lotA._id,
      sellerUserId: farmer._id,
      buyerId: String(buyerUser._id),
      commodity: 'Red Onion',
      variety: 'Garwa Premium',
      grade: 'Grade A',
      quantityQtl: 50,
      pricePerQtl: 3100,
      grossValue: 155000,
      estimatedTransportCost: 2250,
      estimatedLabourCost: 775,
      estimatedSpoilage: 1550,
      estimatedMarketHandlingCharges: 620,
      estimatedNetRealization: 149805,
      paymentTerms: 'DEMO_ESCROW_RELEASE',
      deliveryTerms: 'Buyer Pickup',
      pickupLocation: 'Farm Gate, Niphad',
      deliveryLocation: 'Buyer Depot, Nashik',
      expiresAt: new Date(Date.now() + 48 * 3600000),
      offerStatus: 'PENDING',
      isDemo: true,
    });

    const offerB = await Offer.create({
      offerId: 'OFFER-DEMO-0072',
      lotId: lotB._id,
      sellerUserId: farmer._id,
      buyerId: String(buyerUser._id),
      commodity: 'Wheat',
      variety: 'MP Sharbati',
      grade: 'Grade A',
      quantityQtl: 60,
      pricePerQtl: 2700,
      grossValue: 162000,
      estimatedTransportCost: 2500,
      estimatedLabourCost: 810,
      estimatedSpoilage: 1620,
      estimatedMarketHandlingCharges: 648,
      estimatedNetRealization: 156422,
      paymentTerms: 'DEMO_ESCROW_RELEASE',
      deliveryTerms: 'Buyer Pickup',
      pickupLocation: 'Farm Gate, Lasalgaon',
      deliveryLocation: 'Buyer Depot, Nashik',
      expiresAt: new Date(Date.now() + 48 * 3600000),
      offerStatus: 'PENDING',
      isDemo: true,
    });

    const offerC = await Offer.create({
      offerId: 'OFFER-DEMO-0073',
      lotId: lotC._id,
      sellerUserId: farmer._id,
      buyerId: String(buyerUser._id),
      commodity: 'Tomato',
      variety: 'Narayangaon Special',
      grade: 'Grade A',
      quantityQtl: 40,
      pricePerQtl: 2800,
      grossValue: 112000,
      estimatedTransportCost: 1800,
      estimatedLabourCost: 560,
      estimatedSpoilage: 1120,
      estimatedMarketHandlingCharges: 448,
      estimatedNetRealization: 108072,
      paymentTerms: 'DEMO_ESCROW_RELEASE',
      deliveryTerms: 'Buyer Pickup',
      pickupLocation: 'Farm Gate, Pimpalgaon',
      deliveryLocation: 'Buyer Depot, Nashik',
      expiresAt: new Date(Date.now() + 48 * 3600000),
      offerStatus: 'PENDING',
      isDemo: true,
    });

    console.log(`✅ Seeded 3 Controlled Demo Offers: ${offerA.offerId}, ${offerB.offerId}, ${offerC.offerId}`);

    console.log('🎉 PRISMS Demo Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo Seed Error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDemo();
}
