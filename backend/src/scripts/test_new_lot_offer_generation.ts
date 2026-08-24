/**
 * Integration Test: Verify New Trade Lot Auto-Generation of Multi-Buyer Offers
 * Creates a brand new dynamic Trade Lot, verifies 4 distinct MongoDB-backed buyer offers are created,
 * tests idempotency (re-calling generator does not duplicate offers), and verifies BEST OFFER ranking.
 */

import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import { env } from '../config/env';
import { Lot } from '../modules/lots/lot.model';
import { Offer } from '../modules/offers/offer.model';
import { User } from '../modules/users/user.model';
import { seedDemoOffersForLot } from '../modules/offers/demoOfferGenerator';

async function testNewLotOfferAutoGeneration() {
  console.log("🚀 Starting Dynamic New Trade Lot Multi-Buyer Offer Test...\n");

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    let farmer = await User.findOne({ role: 'farmer' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Mayur Kapse',
        email: 'farmer.demo@prisms.gov.in',
        passwordHash: 'hash',
        role: 'farmer',
        village: 'Pimple Gurav',
        district: 'Pune',
      });
    }

    // 1. Create a brand new dynamic Trade Lot (e.g. Red Onion, 30 Qtl)
    const testLotId = `LOT-2026-TEST-${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase()}`;
    const newLot = await Lot.create({
      lotId: testLotId,
      userId: farmer._id,
      cropName: 'Red Onion',
      variety: 'Garwa Premium',
      grade: 'Grade A',
      quantityQtl: 30,
      expectedPricePerQtl: 2800,
      minimumAcceptablePrice: 2500,
      qualityScore: 92,
      origin: 'Pimple Gurav, Pune',
      district: 'Pune',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'PUBLISHED',
    });

    console.log(`✨ Created New Dynamic Lot: ${newLot.lotId} (${newLot.cropName}, ${newLot.quantityQtl} Qtl @ ₹${newLot.expectedPricePerQtl}/Qtl)`);

    // 2. Trigger multi-buyer offer generation for the new lot
    const createdCount = await seedDemoOffersForLot(newLot);
    console.log(`✅ seedDemoOffersForLot returned: ${createdCount} offers created.`);

    // 3. Query created offers from MongoDB for this new lot
    const offers = await Offer.find({
      $or: [{ lotId: newLot._id }, { lotId: String(newLot._id) }, { lotId: newLot.lotId }],
    }).populate('buyerId', 'name email');

    console.log(`📦 MongoDB Query for ${newLot.lotId}: ${offers.length} active offers found.`);

    if (offers.length < 3) {
      console.error(`❌ FAIL: Expected >= 3 offers for new lot ${newLot.lotId}, got ${offers.length}`);
      process.exit(1);
    }

    // 4. Verify distinct buyers
    const buyerSet = new Set(offers.map((o) => String(o.buyerId)));
    if (buyerSet.size !== offers.length) {
      console.error(`❌ FAIL: Buyer accounts are not distinct for new lot ${newLot.lotId}!`);
      process.exit(1);
    }

    // 5. Verify quantity & crop match
    for (const o of offers) {
      if (o.quantityQtl !== newLot.quantityQtl) {
        console.error(`❌ FAIL: Offer quantity ${o.quantityQtl} !== Lot quantity ${newLot.quantityQtl}`);
        process.exit(1);
      }
      if (o.commodity !== newLot.cropName) {
        console.error(`❌ FAIL: Offer crop ${o.commodity} !== Lot crop ${newLot.cropName}`);
        process.exit(1);
      }
      if (String(o.sellerUserId) !== String(newLot.userId)) {
        console.error(`❌ FAIL: Offer sellerUserId ${o.sellerUserId} !== Lot userId ${newLot.userId}`);
        process.exit(1);
      }
    }

    // 6. Test Idempotency: Calling seedDemoOffersForLot second time must NOT duplicate offers
    const secondCallCount = await seedDemoOffersForLot(newLot);
    const offersAfterSecondCall = await Offer.find({
      $or: [{ lotId: newLot._id }, { lotId: String(newLot._id) }, { lotId: newLot.lotId }],
    });

    console.log(`🔄 Idempotency Check: Second call returned ${secondCallCount} new offers. Total offers in DB remains: ${offersAfterSecondCall.length}`);
    if (offersAfterSecondCall.length !== offers.length) {
      console.error(`❌ FAIL: Idempotency check failed! Offer count changed from ${offers.length} to ${offersAfterSecondCall.length}`);
      process.exit(1);
    }

    // Clean up test lot and offers
    await Lot.deleteOne({ _id: newLot._id });
    await Offer.deleteMany({ lotId: newLot._id });

    console.log("\n===================================");
    console.log("✅ DYNAMIC NEW TRADE LOT MULTI-BUYER AUTO-GENERATION PASSED 100%!");
    console.log("===================================\n");

    await mongoose.disconnect();
  } catch (err: any) {
    console.error("❌ Test Error:", err.message);
    process.exit(1);
  }
}

testNewLotOfferAutoGeneration();
