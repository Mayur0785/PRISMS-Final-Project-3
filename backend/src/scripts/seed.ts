import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js to use Google and Cloudflare DNS to bypass local SRV blocks
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from '../config/env';
import { Market } from '../modules/markets/market.model';
import { Price } from '../modules/prices/price.model';

const MOCK_MARKETS = [
  {
    name: 'Vashi APMC, Navi Mumbai',
    state: 'Maharashtra',
    district: 'Navi Mumbai',
    commodities: ['Onion', 'Tomato', 'Potato', 'Wheat', 'Banana', 'Soybeans'],
    location: {
      type: 'Point',
      coordinates: [73.0031, 19.0745] // [lng, lat]
    }
  },
  {
    name: 'Kalyan APMC',
    state: 'Maharashtra',
    district: 'Thane',
    commodities: ['Banana', 'Onion', 'Tomato', 'Potato'],
    location: {
      type: 'Point',
      coordinates: [73.1305, 19.2403]
    }
  },
  {
    name: 'Panvel APMC',
    state: 'Maharashtra',
    district: 'Raigad',
    commodities: ['Banana', 'Tomato', 'Onion', 'Wheat'],
    location: {
      type: 'Point',
      coordinates: [73.1093, 18.9894]
    }
  },
  {
    name: 'Pune APMC (Gultekdi)',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Tomato', 'Onion', 'Potato', 'Wheat', 'Banana', 'Soybeans'],
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204]
    }
  },
  {
    name: 'Baramati APMC',
    state: 'Maharashtra',
    district: 'Pune',
    commodities: ['Wheat', 'Soybeans', 'Onion', 'Banana'],
    location: {
      type: 'Point',
      coordinates: [74.5815, 18.1517]
    }
  },
  {
    name: 'Lasalgaon Mandi',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Onion', 'Wheat', 'Soybeans', 'Tomato'],
    location: {
      type: 'Point',
      coordinates: [74.2255, 20.1418]
    }
  },
  {
    name: 'Pimpalgaon Baswant APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Tomato', 'Onion', 'Grapes', 'Wheat'],
    location: {
      type: 'Point',
      coordinates: [73.9800, 20.1700]
    }
  },
  {
    name: 'Nashik Main APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    commodities: ['Onion', 'Tomato', 'Grapes', 'Wheat'],
    location: {
      type: 'Point',
      coordinates: [73.7898, 19.9975]
    }
  },
  {
    name: 'Rahuri APMC',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    commodities: ['Wheat', 'Soybeans', 'Onion', 'Cotton'],
    location: {
      type: 'Point',
      coordinates: [74.6500, 19.3900]
    }
  }
];

const generatePrices = (markets: any[]) => {
  const prices = [];
  const today = new Date();
  
  for (const market of markets) {
    for (const commodity of market.commodities) {
      // Realistic base modal price per Quintal in Maharashtra
      let basePrice = 2400;
      if (commodity === 'Onion') basePrice = 2350;
      if (commodity === 'Tomato') basePrice = 3100;
      if (commodity === 'Wheat') basePrice = 2275;
      if (commodity === 'Banana') basePrice = 3700; // ₹37/kg = ₹3700/qtl
      if (commodity === 'Potato') basePrice = 1950;
      if (commodity === 'Soybeans') basePrice = 4800;
      if (commodity === 'Cotton') basePrice = 6900;
      
      // Slight premium in high-consumption terminal markets like Vashi
      if (market.name.includes('Vashi')) {
        basePrice = Math.round(basePrice * 1.08);
      } else if (market.name.includes('Lasalgaon') && commodity === 'Onion') {
        basePrice = Math.round(basePrice * 1.05);
      }

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const noise = (Math.random() - 0.5) * 200;
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

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected');

    console.log('Clearing existing data...');
    await Market.deleteMany({});
    await Price.deleteMany({});
    console.log('✅ Cleared old collections');

    console.log('Inserting Maharashtra markets...');
    const insertedMarkets = await Market.insertMany(MOCK_MARKETS);
    console.log(`✅ Seeded ${insertedMarkets.length} Maharashtra regional mandis`);

    console.log('Generating realistic commodity prices...');
    const mockPrices = generatePrices(insertedMarkets);
    await Price.insertMany(mockPrices);
    console.log(`✅ Seeded ${mockPrices.length} price records across Pune, Mumbai, Nashik mandis`);

    console.log('🎉 Full Maharashtra Mandi Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seed();
