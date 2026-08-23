import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { env } from '../config/env';
import { Market } from '../modules/markets/market.model';
import { Price } from '../modules/prices/price.model';

async function test() {
  await mongoose.connect(env.MONGODB_URI);
  const _m = Market.modelName;

  const livePrices = await Price.find({ source: 'LIVE_GOVT_API' }).populate('marketId');
  console.log('Live prices count:', livePrices.length);
  for (const p of livePrices) {
    const m = p.marketId as any;
    console.log({
      id: p._id,
      commodity: p.commodity,
      modalPrice: p.modalPrice,
      source: p.source,
      marketName: m ? m.name : 'UNMAPPED',
      date: p.date,
      updatedAt: p.updatedAt
    });
  }

  await mongoose.disconnect();
}
test();
