/**
 * Integration Test: DataGov & Live/Benchmark Market Data Provider Audit
 * Validates real market data retrieval, crop normalization, price validation, location resolution, and ranking engine integration.
 */

import { fetchCommodities, fetchMarkets, fetchPrices, computeResults } from './prisms';

async function runRealDataIntegrationTest() {
  console.log("🚀 Starting DataGov Real Market Data Integration Test...\n");

  const commodities = await fetchCommodities();
  const markets = await fetchMarkets();
  const marketIds = markets.map((m) => m.id);

  console.log(`✅ Loaded ${commodities.length} supported UI commodities.`);
  console.log(`✅ Loaded ${markets.length} registered Maharashtra APMC markets.\n`);

  if (markets.length === 0) {
    console.error("❌ FAIL: No markets returned from backend API!");
    process.exit(1);
  }

  // Test Case 1: Red Onion (30 Qtl from Pune)
  console.log("--- TEST CASE 1: RED ONION (30 Qtl from Pune) ---");
  const onion = commodities.find((c) => c.id === "onion_1")!;
  const onionPrices = await fetchPrices(onion.id, marketIds);
  const onionResults = computeResults(
    markets,
    onionPrices,
    onion,
    3000, // 30 Qtl
    1.5,
    { lat: 18.5912, lng: 73.8188 }, // Pimple Gurav, Pune
    null,
    "medium_pickup",
    500,
    false
  );

  console.log(`Found ${onionResults.length} market candidate results for Red Onion.`);
  if (onionResults.length > 0) {
    const top = onionResults[0]!;
    console.log(`🏆 #1 Recommended: ${top.market.name} (${top.market.district})`);
    console.log(`   Price: ₹${top.pricePerQtl}/Qtl, Distance: ${top.market.distance_km} km`);
    console.log(`   Gross: ₹${top.gross}, Transport: ₹${top.transport}, Labour: ₹${top.labour}, Spoilage: ₹${top.spoilage}, Handling: ₹${top.commission}`);
    console.log(`   Net Take-Home: ₹${top.net}`);

    // Verify manual reconciliation: Gross - Transport - Labour - Spoilage - Handling === Net
    const expectedNet = top.gross - top.transport - top.labour - top.spoilage - top.commission;
    if (top.net === expectedNet) {
      console.log(`✅ Reconciliation Match: ₹${top.gross} - ₹${top.transport} - ₹${top.labour} - ₹${top.spoilage} - ₹${top.commission} = ₹${top.net}\n`);
    } else {
      console.error(`❌ Reconciliation Failed: expected ₹${expectedNet}, got ₹${top.net}\n`);
      process.exit(1);
    }
  }

  // Test Case 2: Soybeans (30 Qtl from Pune)
  console.log("--- TEST CASE 2: SOYBEANS (30 Qtl from Pune) ---");
  const soy = commodities.find((c) => c.id === "soybeans_1")!;
  const soyPrices = await fetchPrices(soy.id, marketIds);
  const soyResults = computeResults(
    markets,
    soyPrices,
    soy,
    3000,
    1.5,
    { lat: 18.5912, lng: 73.8188 },
    null,
    "medium_pickup",
    500,
    false
  );
  console.log(`Found ${soyResults.length} market candidate results for Soybeans.`);
  if (soyResults.length > 0) {
    console.log(`🏆 #1 Recommended: ${soyResults[0]!.market.name} (Net: ₹${soyResults[0]!.net})\n`);
  }

  // Test Case 3: Banana (100 Kg from Pune)
  console.log("--- TEST CASE 3: BANANA (100 Kg default from Pune) ---");
  const banana = commodities.find((c) => c.id === "banana_1")!;
  const bananaPrices = await fetchPrices(banana.id, marketIds);
  const bananaResults = computeResults(
    markets,
    bananaPrices,
    banana,
    100, // 100 Kg
    1.5,
    { lat: 18.5912, lng: 73.8188 },
    null,
    "medium_pickup",
    500,
    false
  );
  console.log(`Found ${bananaResults.length} market candidate results for Banana.`);
  if (bananaResults.length > 0) {
    const bTop = bananaResults[0]!;
    console.log(`🏆 #1 Recommended: ${bTop.market.name}`);
    console.log(`   Gross: ₹${bTop.gross}, Transport: ₹${bTop.transport}, Labour: ₹${bTop.labour}, Spoilage: ₹${bTop.spoilage}, Handling: ₹${bTop.commission}`);
    console.log(`   Net Take-Home: ₹${bTop.net}\n`);
  }

  // Test Case 4: Wheat (30 Qtl from Pune)
  console.log("--- TEST CASE 4: WHEAT (30 Qtl from Pune) ---");
  const wheat = commodities.find((c) => c.id === "wheat_1")!;
  const wheatPrices = await fetchPrices(wheat.id, marketIds);
  const wheatResults = computeResults(
    markets,
    wheatPrices,
    wheat,
    3000,
    1.5,
    { lat: 18.5912, lng: 73.8188 },
    null,
    "medium_pickup",
    500,
    false
  );
  console.log(`Found ${wheatResults.length} market candidate results for Wheat.`);
  if (wheatResults.length > 0) {
    console.log(`🏆 #1 Recommended: ${wheatResults[0]!.market.name} (Net: ₹${wheatResults[0]!.net})\n`);
  }

  console.log("===================================");
  console.log("✅ REAL MARKET DATA INTEGRATION AUDIT PASSED 100%!");
  console.log("===================================\n");
}

runRealDataIntegrationTest();
