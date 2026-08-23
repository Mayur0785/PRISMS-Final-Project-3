import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { env } from '../config/env';
import { Price } from '../modules/prices/price.model';
import { Market } from '../modules/markets/market.model';
import { validateAndNormalizeGovRecord } from '../modules/prices/dataGov.service';

async function runValidationTests() {
  console.log('🧪 Running Refined Mandi Data Validation Test Suite...\n');

  await mongoose.connect(env.MONGODB_URI);
  const _m = Market.modelName;

  const results: Record<string, { pass: boolean; details: string }> = {};

  try {
    // ------------------------------------------------------------------------
    // CASE 1: Min = 1000, Modal = 1500, Max = 2000 -> Expected: VALIDATED
    // ------------------------------------------------------------------------
    const res1 = validateAndNormalizeGovRecord({
      market: 'Vashi APMC',
      commodity: 'Onion',
      arrival_date: '20/08/2026',
      min_price: 1000,
      modal_price: 1500,
      max_price: 2000,
    });
    const case1Pass = res1.validationStatus === 'VALIDATED' && res1.modalPrice === 1500;
    results['CASE 1 — Valid Hierarchy (Min=1000, Modal=1500, Max=2000)'] = {
      pass: case1Pass,
      details: case1Pass
        ? `Status: ${res1.validationStatus} (Reason: ${res1.validationReason})`
        : `Failed: Status=${res1.validationStatus}`,
    };

    // ------------------------------------------------------------------------
    // CASE 2: Min = 1000, Modal = 2500, Max = 2000 -> Expected: INVALID
    // ------------------------------------------------------------------------
    const res2 = validateAndNormalizeGovRecord({
      market: 'Vashi APMC',
      commodity: 'Onion',
      arrival_date: '20/08/2026',
      min_price: 1000,
      modal_price: 2500,
      max_price: 2000,
    });
    const case2Pass = res2.validationStatus === 'INVALID' && res2.validationReason.includes('exceeds maximum price');
    results['CASE 2 — Invalid (Modal > Max)'] = {
      pass: case2Pass,
      details: case2Pass
        ? `Correctly flagged INVALID: "${res2.validationReason}"`
        : `Failed to flag invalid: ${JSON.stringify(res2)}`,
    };

    // ------------------------------------------------------------------------
    // CASE 3: Min = 2000, Modal = 1500, Max = 2500 -> Expected: INVALID
    // ------------------------------------------------------------------------
    const res3 = validateAndNormalizeGovRecord({
      market: 'Vashi APMC',
      commodity: 'Onion',
      arrival_date: '20/08/2026',
      min_price: 2000,
      modal_price: 1500,
      max_price: 2500,
    });
    const case3Pass = res3.validationStatus === 'INVALID' && res3.validationReason.includes('exceeds modal price');
    results['CASE 3 — Invalid (Min > Modal)'] = {
      pass: case3Pass,
      details: case3Pass
        ? `Correctly flagged INVALID: "${res3.validationReason}"`
        : `Failed to flag invalid: ${JSON.stringify(res3)}`,
    };

    // ------------------------------------------------------------------------
    // CASE 4: Incomplete Price Range -> Expected: REVIEW (Correction 2)
    // ------------------------------------------------------------------------
    const res4 = validateAndNormalizeGovRecord({
      market: 'Vashi APMC',
      commodity: 'Onion',
      arrival_date: '20/08/2026',
      min_price: 1000,
      modal_price: 1500,
      max_price: '' as any, // Incomplete max price
    });
    const case4Pass = res4.validationStatus === 'REVIEW' && res4.validationReason === 'Incomplete price range';
    results['CASE 4 — Incomplete Price Range (Default to REVIEW)'] = {
      pass: case4Pass,
      details: case4Pass
        ? `Correctly set REVIEW status: "${res4.validationReason}"`
        : `Failed incomplete price test: ${JSON.stringify(res4)}`,
    };

    // ------------------------------------------------------------------------
    // CASE 5: Unit Normalization (Rs/Kg -> Rs/Qtl)
    // ------------------------------------------------------------------------
    const res5 = validateAndNormalizeGovRecord({
      market: 'Vashi APMC',
      commodity: 'Tomato',
      unit: 'Rs/Kg',
      arrival_date: '20/08/2026',
      min_price: 10,
      modal_price: 15,
      max_price: 20,
    });
    const case5Pass =
      res5.validationStatus === 'VALIDATED' &&
      res5.sourcePrice === 15 &&
      res5.sourceUnit === 'Rs/Kg' &&
      res5.normalizedPrice === 1500;

    results['CASE 5 — Unit Normalization (Rs/Kg -> Rs/Qtl)'] = {
      pass: case5Pass,
      details: case5Pass
        ? `Normalized Rs 15/Kg -> ₹${res5.normalizedPrice}/Qtl while preserving sourcePrice=15 & sourceUnit=Rs/Kg`
        : `Failed unit normalization: ${JSON.stringify(res5)}`,
    };

    // ------------------------------------------------------------------------
    // CASE 6: Deterministic sourceRecordKey Deduplication (Correction 3)
    // ------------------------------------------------------------------------
    let testMarket = await Market.findOne({ name: /Vashi/i });
    if (!testMarket) {
      testMarket = await Market.create({
        name: 'Vashi APMC, Navi Mumbai',
        state: 'Maharashtra',
        district: 'Navi Mumbai',
        commodities: ['Onion'],
        location: { type: 'Point', coordinates: [73.0031, 19.0745] },
      });
    }

    const testRecordKey = 'gov_maharashtra_navi_mumbai_vashi_apmc_oniontest_standard_faq_20_08_2026';
    const filterKey = { sourceRecordKey: testRecordKey };

    // Initial Sync Insertion
    await Price.updateOne(
      filterKey,
      {
        $set: {
          marketId: testMarket._id,
          commodity: 'OnionTest',
          variety: 'Standard',
          grade: 'FAQ',
          minPrice: 2000,
          maxPrice: 3000,
          modalPrice: 2500,
          source: 'LIVE_GOVT_API',
          sourceRecordKey: testRecordKey,
          validationStatus: 'VALIDATED',
          date: new Date('2026-08-20T00:00:00.000Z'),
        },
      },
      { upsert: true }
    );

    // Repeated Sync with updated price using sourceRecordKey
    await Price.updateOne(
      filterKey,
      {
        $set: {
          marketId: testMarket._id,
          commodity: 'OnionTest',
          variety: 'Standard',
          grade: 'FAQ',
          minPrice: 2100,
          maxPrice: 3100,
          modalPrice: 2600,
          source: 'LIVE_GOVT_API',
          sourceRecordKey: testRecordKey,
          validationStatus: 'VALIDATED',
          date: new Date('2026-08-20T00:00:00.000Z'),
        },
      },
      { upsert: true }
    );

    const count = await Price.countDocuments(filterKey);
    const updatedDoc = await Price.findOne(filterKey);

    const case6Pass = count === 1 && updatedDoc?.modalPrice === 2600 && updatedDoc?.sourceRecordKey === testRecordKey;

    results['CASE 6 — Deterministic sourceRecordKey Deduplication'] = {
      pass: case6Pass,
      details: case6Pass
        ? `Single Mongo document maintained via sourceRecordKey (count=${count}), modalPrice updated to ₹${updatedDoc?.modalPrice}`
        : `Failed sourceRecordKey test: count=${count}`,
    };

    // Cleanup temporary test records
    await Price.deleteMany({ commodity: 'OnionTest' });
  } catch (err: any) {
    console.error('Validation test error:', err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log('====================================================');
  console.log('📊 REFINED MANDI DATA VALIDATION TEST RESULTS');
  console.log('====================================================');
  let totalPassed = 0;
  for (const [testName, res] of Object.entries(results)) {
    const icon = res.pass ? '✅' : '❌';
    if (res.pass) totalPassed++;
    console.log(`${icon} ${testName}`);
    console.log(`   └─ ${res.details}`);
  }
  console.log('====================================================');
  console.log(`Summary: ${totalPassed}/${Object.keys(results).length} Cases Passed.\n`);
}

runValidationTests();
