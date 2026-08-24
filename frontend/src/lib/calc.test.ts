/**
 * Mathematical Calculation Verification Test Suite
 * Validates PRISMS / KrishiSetu market net realization formulas.
 */

import { computeResults } from './prisms';

function runTests() {
  console.log("🚀 Starting Automated Net-Realisation Calculation Tests...\n");

  let passed = 0;
  let failed = 0;

  function assertEqual(actual: any, expected: any, message: string) {
    if (actual === expected) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message} | Expected: ${expected}, Got: ${actual}`);
      failed++;
    }
  }

  // TEST 1: User Prompt Verification Case
  // Quantity: 30 Qtl, Price: ₹2,750/Qtl, Transport: ₹485, Labour: ₹500, Spoilage: 8%, Handling: 1%
  const sampleCommodity = {
    id: "onion_1",
    name: "Red Onion",
    spoilage_rate_percent: 8,
    unit: "kg"
  };

  const sampleMarkets = [
    {
      id: "m1",
      name: "Pune APMC",
      latitude: 18.5204,
      longitude: 73.8567,
      distance_km: 10.78, // Adjusted so transport = Math.round(10.78 * 1.5 * 30) = 485
      commission_fee_percent: 1,
      district: "Pune",
      state: "Maharashtra"
    }
  ];

  const samplePrices = [
    { market_id: "m1", price_per_unit: 2750 } // ₹2,750/Qtl
  ];

  const results1 = computeResults(
    sampleMarkets,
    samplePrices,
    sampleCommodity,
    3000, // 3000 kg = 30 Qtl
    1.5, // ₹1.50/km/Qtl
    null,
    [10.777777777777777], // Distance to yield exactly 485
    "medium_pickup",
    500, // Labour per trip
    false
  );

  const res1 = results1[0]!;
  assertEqual(res1.gross, 82500, "Gross Revenue is ₹82,500");
  assertEqual(res1.transport, 485, "Transport Freight is ₹485");
  assertEqual(res1.labour, 500, "Labour Charges is ₹500");
  assertEqual(res1.spoilage, 6600, "Spoilage Loss (8%) is ₹6,600");
  assertEqual(res1.commission, 825, "Handling Fee (1%) is ₹825");
  assertEqual(res1.net, 74090, "Net Realisation is ₹74,090");

  // Mathematical Reconciliation Check
  const expectedNet1 = res1.gross - res1.transport - res1.labour - res1.spoilage - res1.commission;
  assertEqual(res1.net, expectedNet1, "Breakdown sum equals Net Realisation (82500 - 485 - 500 - 6600 - 825 = 74090)");

  // TEST 2: Price Unit Conversion (₹24.50/Kg -> ₹2,450/Qtl)
  const samplePricesKg = [
    { market_id: "m1", price_per_unit: 24.50 } // ₹24.50/Kg
  ];

  const results2 = computeResults(
    sampleMarkets,
    samplePricesKg,
    sampleCommodity,
    3000, // 30 Qtl
    1.5,
    null,
    [10.777777777777777],
    "medium_pickup",
    500,
    false
  );

  const res2 = results2[0]!;
  assertEqual(res2.pricePerQtl, 2450, "Normalized Price per Qtl is ₹2,450 from ₹24.50/Kg");
  assertEqual(res2.gross, 73500, "Gross Revenue is ₹73,500 for 30 Qtl @ ₹24.50/Kg");

  // TEST 3: Multi-trip Labour Calculation (300 Qtl with 150 Qtl vehicle capacity -> 2 trips)
  const results3 = computeResults(
    sampleMarkets,
    samplePrices,
    sampleCommodity,
    30000, // 300 Qtl
    1.5,
    null,
    [10],
    "medium_pickup", // 30 Qtl capacity -> 10 trips
    500,
    false
  );

  const res3 = results3[0]!;
  assertEqual(res3.trips, 10, "300 Qtl / 30 Qtl capacity = 10 trips");
  assertEqual(res3.labour, 5000, "Labour for 10 trips @ ₹500/trip = ₹5,000");

  console.log(`\n===================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
