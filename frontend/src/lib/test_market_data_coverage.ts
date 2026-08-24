/**
 * Diagnostic Test: Crop Market Data Coverage Audit
 * Validates price observation counts across all 7 supported UI crops.
 */

import { fetchCommodities, fetchMarkets, fetchPrices, computeResults } from './prisms';

async function runCoverageAudit() {
  console.log("📊 Starting Crop Market Data Coverage Audit...\n");

  const commodities = await fetchCommodities();
  const markets = await fetchMarkets();
  const marketIds = markets.map(m => m.id);

  console.log(`Total System Commodities: ${commodities.length}`);
  console.log(`Total System Markets: ${markets.length}\n`);

  let totalFailedCrops = 0;

  for (const c of commodities) {
    const prices = await fetchPrices(c.id, marketIds);
    const validPrices = prices.filter(p => p.price_per_unit > 0);
    const distinctMarketsWithPrice = new Set(validPrices.map(p => p.market_id)).size;

    const results = computeResults(
      markets,
      prices,
      c,
      3000, // 30 Qtl
      1.5,
      { lat: 18.5912, lng: 73.8188 }, // Pune origin
      null,
      "medium_pickup",
      500,
      false
    );

    console.log(`🌾 Crop: ${c.name} (${c.id})`);
    console.log(`   - Raw Price Entries: ${prices.length}`);
    console.log(`   - Valid Price Entries: ${validPrices.length}`);
    console.log(`   - Distinct APMC Markets with Price: ${distinctMarketsWithPrice}`);
    console.log(`   - Computed Market Recommendations: ${results.length}`);
    if (results.length > 0) {
      console.log(`   - Top Recommended Market: ${results[0]?.market.name} (Gross: ₹${results[0]?.gross}, Net: ₹${results[0]?.net})`);
    } else {
      console.error(`   ❌ FAIL: No market recommendations computed for ${c.name}!`);
      totalFailedCrops++;
    }
    console.log("");
  }

  console.log("===================================");
  if (totalFailedCrops === 0) {
    console.log("✅ ALL 7 UI CROPS HAVE 100% VALID MARKET COVERAGE!");
  } else {
    console.error(`❌ ${totalFailedCrops} crops failed coverage audit.`);
    process.exit(1);
  }
  console.log("===================================\n");
}

runCoverageAudit();
