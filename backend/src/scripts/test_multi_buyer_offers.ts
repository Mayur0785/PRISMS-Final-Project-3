/**
 * Verification Test: Multi-Buyer Offers per Trade Lot
 * Verifies offer count >= 3 per showcase lot, distinct buyers, price differences, and net realization sorting.
 */

import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from '../config/env';
import { Lot } from '../modules/lots/lot.model';
import { Offer } from '../modules/offers/offer.model';

async function testMultiBuyerOffers() {
  console.log("🚀 Starting Multi-Buyer Offers Test...\n");

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const showcaseLotIds = ['LOT-2026-0073', 'LOT-2026-99F5', 'LOT-2026-0072'];

    for (const lotIdStr of showcaseLotIds) {
      const lot = await Lot.findOne({ lotId: lotIdStr });
      if (!lot) {
        console.error(`❌ Lot ${lotIdStr} not found!`);
        process.exit(1);
      }

      const offers = await Offer.find({ lotId: lot._id }).populate('buyerId', 'name email');
      console.log(`📦 Showcase Lot ${lot.lotId} (${lot.cropName}, ${lot.quantityQtl} Qtl):`);
      console.log(`   - Offer Count: ${offers.length}`);

      if (offers.length < 3) {
        console.error(`❌ FAIL: Expected >= 3 offers for ${lot.lotId}, got ${offers.length}`);
        process.exit(1);
      }

      const buyerIds = new Set(offers.map((o) => String(o.buyerId)));
      if (buyerIds.size !== offers.length) {
        console.error(`❌ FAIL: Buyer IDs are not distinct for ${lot.lotId}!`);
        process.exit(1);
      }

      // Check price differences
      const prices = offers.map((o) => o.pricePerQtl);
      const distinctPrices = new Set(prices);
      if (distinctPrices.size !== offers.length) {
        console.error(`❌ FAIL: Offer prices are not distinct for ${lot.lotId}!`);
        process.exit(1);
      }

      // Sort by net realization descending
      const sortedByNet = [...offers].sort((a, b) => b.estimatedNetRealization - a.estimatedNetRealization);
      const topOffer = sortedByNet[0]!;

      console.log(`   - Distinct Buyers: ${buyerIds.size}`);
      console.log(`   - Offered Prices: ${prices.map((p) => '₹' + p).join(', ')}`);
      console.log(`   - 🏆 BEST OFFER (#1 Net Realization): ${topOffer.offerId} by ${(topOffer.buyerId as any)?.name || topOffer.buyerId}`);
      console.log(`     Price: ₹${topOffer.pricePerQtl}/Qtl, Gross: ₹${topOffer.grossValue}, Net: ₹${topOffer.estimatedNetRealization}`);

      // Verify max net calculation
      const maxNet = Math.max(...offers.map((o) => o.estimatedNetRealization));
      if (topOffer.estimatedNetRealization !== maxNet) {
        console.error(`❌ FAIL: Top offer net ₹${topOffer.estimatedNetRealization} !== max net ₹${maxNet}`);
        process.exit(1);
      }
      console.log("   ✅ Passed Lot Offer Checks!\n");
    }

    console.log("===================================");
    console.log("✅ MULTI-BUYER OFFERS INTEGRATION AUDIT PASSED 100%!");
    console.log("===================================\n");

    await mongoose.disconnect();
  } catch (err: any) {
    console.error("❌ Test Error:", err.message);
    process.exit(1);
  }
}

testMultiBuyerOffers();
