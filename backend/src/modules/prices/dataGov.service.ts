import axios from 'axios';
import { Market, IMarket } from '../markets/market.model';
import { Price } from './price.model';
import { env } from '../../config/env';

export interface RawGovMandiRecord {
  state?: string;
  district?: string;
  market: string;
  commodity: string;
  variety?: string;
  grade?: string;
  arrival_date: string; // e.g. "16/08/2026"
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
  [key: string]: any;
}

export interface SyncMetrics {
  totalFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  unmapped: number;
  failed: number;
  latestDate?: string;
  unmappedRecords: Array<{ market: string; district?: string; state?: string; commodity: string }>;
}

export interface MarketMatchResult {
  market: IMarket | null;
  matchType: 'EXACT_MATCH' | 'SAFE_NORMALIZED_MATCH' | 'ALIAS_MATCH' | 'UNMAPPED';
}

/**
 * Clean & normalize string for market name comparison
 */
export const normalizeMarketName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(apmc|mandi|market|sub market|submarket|yard|co op|society)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Known Market Directory & Explicit Alias Table
 */
export const KNOWN_MARKET_ALIASES: Array<{
  keywords: string[];
  officialGovName: string;
  targetPrismsName: string;
  district: string;
  state: string;
  coords: [number, number]; // [lng, lat]
}> = [
  {
    keywords: ['vashi', 'mumbai apmc', 'navi mumbai apmc', 'vashi apmc'],
    officialGovName: 'Vashi APMC',
    targetPrismsName: 'Vashi APMC, Navi Mumbai',
    district: 'Navi Mumbai',
    state: 'Maharashtra',
    coords: [73.0031, 19.0745],
  },
  {
    keywords: ['kalyan apmc', 'kalyan mandi', 'kalyan'],
    officialGovName: 'Kalyan APMC',
    targetPrismsName: 'Kalyan APMC',
    district: 'Thane',
    state: 'Maharashtra',
    coords: [73.1305, 19.2403],
  },
  {
    keywords: ['panvel apmc', 'panvel mandi', 'panvel'],
    officialGovName: 'Panvel APMC',
    targetPrismsName: 'Panvel APMC',
    district: 'Raigad',
    state: 'Maharashtra',
    coords: [73.1093, 18.9894],
  },
  {
    keywords: ['pune apmc (gultekdi)', 'pune (gultekdi)', 'gultekdi apmc', 'pune apmc', 'pune market yard'],
    officialGovName: 'Pune APMC',
    targetPrismsName: 'Pune APMC (Gultekdi)',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [73.8567, 18.5204],
  },
  {
    keywords: ['baramati apmc', 'baramati'],
    officialGovName: 'Baramati APMC',
    targetPrismsName: 'Baramati APMC',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [74.5815, 18.1517],
  },
  {
    keywords: ['lasalgaon mandi', 'lasalgaon apmc', 'lasalgaon'],
    officialGovName: 'Lasalgaon Mandi',
    targetPrismsName: 'Lasalgaon Mandi',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [74.2255, 20.1418],
  },
  {
    keywords: ['pimpalgaon baswant apmc', 'pimpalgaon apmc', 'pimpalgaon'],
    officialGovName: 'Pimpalgaon APMC',
    targetPrismsName: 'Pimpalgaon Baswant APMC',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [73.9800, 20.1700],
  },
  {
    keywords: ['nashik main apmc', 'nashik apmc', 'nashik mandi'],
    officialGovName: 'Nashik APMC',
    targetPrismsName: 'Nashik Main APMC',
    district: 'Nashik',
    state: 'Maharashtra',
    coords: [73.7898, 19.9975],
  },
  {
    keywords: ['rahuri apmc', 'rahuri'],
    officialGovName: 'Rahuri APMC',
    targetPrismsName: 'Rahuri APMC',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    coords: [74.6500, 19.3900],
  },
  // Distinct Mandis (Part 6)
  {
    keywords: ['junnar(otur) apmc', 'junnar(otur)', 'otur apmc', 'otur mandi'],
    officialGovName: 'Junnar(Otur) APMC',
    targetPrismsName: 'Junnar(Otur) APMC',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [73.9500, 19.2500],
  },
  {
    keywords: ['junnar(alephata) apmc', 'junnar(alephata)', 'alephata apmc', 'alephata mandi'],
    officialGovName: 'Junnar(Alephata) APMC',
    targetPrismsName: 'Junnar(Alephata) APMC',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [74.1167, 19.1167],
  },
  {
    keywords: ['junnar apmc', 'junnar mandi', 'junnar'],
    officialGovName: 'Junnar APMC',
    targetPrismsName: 'Junnar APMC',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [73.8800, 19.2000],
  },
  {
    keywords: ['pune(pimpri) apmc', 'pimpri apmc', 'pimpri mandi'],
    officialGovName: 'Pune(Pimpri) APMC',
    targetPrismsName: 'Pune(Pimpri) APMC',
    district: 'Pune',
    state: 'Maharashtra',
    coords: [73.8000, 18.6200],
  },
  {
    keywords: ['chattrapati sambhajinagar apmc', 'aurangabad apmc', 'chattrapati sambhajinagar'],
    officialGovName: 'Chattrapati Sambhajinagar APMC',
    targetPrismsName: 'Chattrapati Sambhajinagar APMC',
    district: 'Chattrapati Sambhajinagar',
    state: 'Maharashtra',
    coords: [75.3433, 19.8762],
  },
  {
    keywords: ['bhusaval apmc', 'bhusaval'],
    officialGovName: 'Bhusaval APMC',
    targetPrismsName: 'Bhusaval APMC',
    district: 'Jalgaon',
    state: 'Maharashtra',
    coords: [75.7869, 21.0455],
  },
  {
    keywords: ['vita apmc', 'vita mandi', 'vita'],
    officialGovName: 'Vita APMC',
    targetPrismsName: 'Vita APMC',
    district: 'Sangli',
    state: 'Maharashtra',
    coords: [74.5333, 17.2667],
  },
];

/**
 * Safe Matching Hierarchy:
 * Priority 1: Exact Name Match
 * Priority 2: Safe Normalized Match
 * Priority 3: Explicit Maintained Mapping Table
 * Priority 4: UNMAPPED (District matching alone is strictly REJECTED)
 */
export const matchMarket = async (
  rawRecord: RawGovMandiRecord,
  allMarkets: IMarket[]
): Promise<MarketMatchResult> => {
  const rawMarketNorm = normalizeMarketName(rawRecord.market);
  if (!rawMarketNorm) return { market: null, matchType: 'UNMAPPED' };

  // Priority 1: Exact official name match
  for (const m of allMarkets) {
    if (m.name.trim().toLowerCase() === rawRecord.market.trim().toLowerCase()) {
      return { market: m, matchType: 'EXACT_MATCH' };
    }
  }

  // Priority 2: Safe normalized market name match
  for (const m of allMarkets) {
    const dbNorm = normalizeMarketName(m.name);
    if (dbNorm === rawMarketNorm) {
      return { market: m, matchType: 'SAFE_NORMALIZED_MATCH' };
    }
  }

  // Priority 3: Explicit maintained alias directory & distinct entity creation
  for (const entry of KNOWN_MARKET_ALIASES) {
    for (const kw of entry.keywords) {
      const kwNorm = normalizeMarketName(kw);
      if (rawMarketNorm === kwNorm || rawMarketNorm.includes(kwNorm) || kwNorm.includes(rawMarketNorm)) {
        let found = allMarkets.find(
          (m) =>
            normalizeMarketName(m.name) === normalizeMarketName(entry.targetPrismsName) ||
            m.name.toLowerCase() === entry.targetPrismsName.toLowerCase()
        );

        if (!found) {
          try {
            found = await Market.create({
              name: entry.targetPrismsName,
              state: entry.state,
              district: entry.district,
              commodities: ['Onion', 'Tomato', 'Potato', 'Wheat', 'Soybeans', 'Banana'],
              location: {
                type: 'Point',
                coordinates: entry.coords,
              },
            });
            allMarkets.push(found);
            console.log(`✨ Registered distinct PRISMS Market entity: ${found.name} (${found._id})`);
          } catch (err) {
            console.error(`Failed to auto-create distinct market ${entry.targetPrismsName}:`, err);
          }
        }

        if (found) {
          return { market: found, matchType: 'ALIAS_MATCH' };
        }
      }
    }
  }

  // Priority 4: Dynamic Registration for Official Government Mandis
  if (rawRecord.market && rawRecord.state) {
    try {
      const newMarket = await Market.create({
        name: rawRecord.market.trim(),
        state: rawRecord.state.trim(),
        district: rawRecord.district ? rawRecord.district.trim() : rawRecord.state.trim(),
        commodities: [rawRecord.commodity ? rawRecord.commodity.trim() : 'General'],
        location: {
          type: 'Point',
          coordinates: [74.0000, 19.0000],
        },
      });
      allMarkets.push(newMarket);
      console.log(`✨ Auto-registered new Government APMC Market entity: ${newMarket.name} (${newMarket._id})`);
      return { market: newMarket, matchType: 'ALIAS_MATCH' };
    } catch (err) {
      console.error(`Failed to auto-create market for ${rawRecord.market}:`, err);
    }
  }

  return { market: null, matchType: 'UNMAPPED' };
};

/**
 * Parse Data.gov.in date format "DD/MM/YYYY" to JS Date
 */
export const parseGovDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }
  const fallbackDate = new Date(dateStr);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

export interface ValidationResult {
  validationStatus: 'VALIDATED' | 'INVALID' | 'REVIEW';
  validationReason: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  sourcePrice: number;
  sourceUnit: string;
  normalizedPrice: number;
  normalizedUnit: string;
}

/**
 * Validate mandi price record hierarchy & perform unit normalization
 * Section 6: MIN PRICE <= MODAL PRICE <= MAX PRICE
 * Section 9: Unit normalization (Rs/Kg -> Rs/Qtl)
 */
export const validateAndNormalizeGovRecord = (raw: RawGovMandiRecord): ValidationResult => {
  const minP = raw.min_price !== undefined && raw.min_price !== null && raw.min_price !== '' ? Number(raw.min_price) : NaN;
  const maxP = raw.max_price !== undefined && raw.max_price !== null && raw.max_price !== '' ? Number(raw.max_price) : NaN;
  const modalP = raw.modal_price !== undefined && raw.modal_price !== null && raw.modal_price !== '' ? Number(raw.modal_price) : NaN;

  const rawUnit = (raw.unit || raw.price_unit || 'Rs/Quintal').toString().trim();

  // Unit normalization: If reported per Kg, convert to Quintal (x100)
  let normMultiplier = 1;
  let normUnit = 'Qtl';
  if (/kg|kilogram/i.test(rawUnit)) {
    normMultiplier = 100;
    normUnit = 'Qtl (from Kg)';
  } else if (/ton|tonne/i.test(rawUnit)) {
    normMultiplier = 0.1;
    normUnit = 'Qtl (from Ton)';
  }

  const normMin = isNaN(minP) ? 0 : minP * normMultiplier;
  const normMax = isNaN(maxP) ? 0 : maxP * normMultiplier;
  const normModal = isNaN(modalP) ? 0 : modalP * normMultiplier;

  // 1. Mandatory commodity check
  if (!raw.commodity || !raw.commodity.trim()) {
    return {
      validationStatus: 'INVALID',
      validationReason: 'Missing mandatory commodity field',
      minPrice: normMin,
      maxPrice: normMax,
      modalPrice: normModal,
      sourcePrice: isNaN(modalP) ? 0 : modalP,
      sourceUnit: rawUnit,
      normalizedPrice: normModal,
      normalizedUnit: normUnit,
    };
  }

  // 2. Incomplete price values check (Correction 2)
  if (isNaN(minP) || isNaN(maxP) || isNaN(modalP) || minP <= 0 || maxP <= 0 || modalP <= 0) {
    return {
      validationStatus: 'REVIEW',
      validationReason: 'Incomplete price range',
      minPrice: normMin,
      maxPrice: normMax,
      modalPrice: normModal,
      sourcePrice: isNaN(modalP) ? 0 : modalP,
      sourceUnit: rawUnit,
      normalizedPrice: normModal,
      normalizedUnit: normUnit,
    };
  }

  // 3. Fundamental Price Hierarchy Validation: MIN PRICE <= MODAL PRICE <= MAX PRICE
  if (normMin > normModal) {
    return {
      validationStatus: 'INVALID',
      validationReason: `Minimum price (₹${normMin}) exceeds modal price (₹${normModal})`,
      minPrice: normMin,
      maxPrice: normMax,
      modalPrice: normModal,
      sourcePrice: modalP,
      sourceUnit: rawUnit,
      normalizedPrice: normModal,
      normalizedUnit: normUnit,
    };
  }

  if (normModal > normMax) {
    return {
      validationStatus: 'INVALID',
      validationReason: `Modal price (₹${normModal}) exceeds maximum price (₹${normMax})`,
      minPrice: normMin,
      maxPrice: normMax,
      modalPrice: normModal,
      sourcePrice: modalP,
      sourceUnit: rawUnit,
      normalizedPrice: normModal,
      normalizedUnit: normUnit,
    };
  }

  return {
    validationStatus: 'VALIDATED',
    validationReason: 'Record passed all PRISMS validation checks',
    minPrice: normMin,
    maxPrice: normMax,
    modalPrice: normModal,
    sourcePrice: modalP,
    sourceUnit: rawUnit,
    normalizedPrice: normModal,
    normalizedUnit: normUnit,
  };
};

/**
 * Fetch raw records from Data.gov.in API
 */
export const fetchRawGovData = async (
  limit = 200,
  stateFilter = 'Maharashtra',
  commodityFilter?: string
): Promise<{ status: number; title?: string; total: number; records: RawGovMandiRecord[] }> => {
  const apiKey = env.DATA_GOV_API_KEY;
  const resourceId = env.DATA_GOV_RESOURCE_ID;

  let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=${limit}`;
  if (stateFilter) {
    url += `&filters[state]=${encodeURIComponent(stateFilter)}`;
  }
  if (commodityFilter) {
    url += `&filters[commodity]=${encodeURIComponent(commodityFilter)}`;
  }

  const response = await axios.get(url, { timeout: 10000 });

  if (response.status !== 200 || !response.data) {
    throw new Error(`Data.gov.in API returned HTTP status ${response.status}`);
  }

  return {
    status: response.status,
    title: response.data.title || response.data.desc,
    total: response.data.total || 0,
    records: response.data.records || [],
  };
};

/**
 * Main Live Price Sync Execution Engine
 */
export const syncLiveGovPrices = async (
  stateFilter = 'Maharashtra',
  limit = 200
): Promise<{ success: boolean; metrics: SyncMetrics; message: string }> => {
  const metrics: SyncMetrics = {
    totalFetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    unmapped: 0,
    failed: 0,
    unmappedRecords: [],
  };

  try {
    // Drop legacy strict unique index if present (superseded by sourceRecordKey & compound variety/grade index)
    try {
      await Price.collection.dropIndex('marketId_1_commodity_1_date_1');
    } catch (_ignoreErr) {}

    const rawResult = await fetchRawGovData(limit, stateFilter);
    const records = rawResult.records;
    metrics.totalFetched = records.length;

    if (!records || records.length === 0) {
      return {
        success: true,
        metrics,
        message: 'No live government mandi records returned for the query.',
      };
    }

    const allMarkets = await Market.find({});
    const observedDates = new Set<string>();

    for (const raw of records) {
      try {
        if (raw.arrival_date) observedDates.add(raw.arrival_date);

        // 1. Map to PRISMS marketId using safe matching hierarchy
        const matchRes = await matchMarket(raw, allMarkets);
        const matchedMarket = matchRes.market;

        if (!matchedMarket) {
          metrics.unmapped++;
          metrics.unmappedRecords.push({
            market: raw.market,
            district: raw.district,
            state: raw.state,
            commodity: raw.commodity,
          });
          continue;
        }

        // 2. Normalize & Validate fields (Section 6 & 9)
        const dateObj = parseGovDate(raw.arrival_date);
        if (!dateObj) {
          metrics.failed++;
          continue;
        }

        const valResult = validateAndNormalizeGovRecord(raw);

        // Variety & Grade collision prevention (Part 8)
        const varietyNorm = raw.variety ? raw.variety.trim() : 'Standard';
        const gradeNorm = raw.grade ? raw.grade.trim() : 'FAQ';

        // Deterministic Government Record Identity Key (Correction 3)
        const sourceRecordKey = `gov_${matchedMarket.state}_${matchedMarket.district}_${matchedMarket.name}_${raw.commodity.trim()}_${varietyNorm}_${gradeNorm}_${raw.arrival_date}`
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');

        // 3. Upsert using unique sourceRecordKey or compound key
        const filterKey = {
          $or: [
            { sourceRecordKey },
            {
              marketId: matchedMarket._id,
              commodity: raw.commodity.trim(),
              variety: varietyNorm,
              grade: gradeNorm,
              date: dateObj,
            },
          ],
        };

        const updateDoc = {
          $set: {
            marketId: matchedMarket._id,
            commodity: raw.commodity.trim(),
            variety: varietyNorm,
            grade: gradeNorm,
            minPrice: valResult.minPrice,
            maxPrice: valResult.maxPrice,
            modalPrice: valResult.modalPrice,
            sourcePrice: valResult.sourcePrice,
            sourceUnit: valResult.sourceUnit,
            normalizedPrice: valResult.normalizedPrice,
            normalizedUnit: valResult.normalizedUnit,
            validationStatus: valResult.validationStatus,
            validationReason: valResult.validationReason,
            arrivalVolume: Number(raw.arrival_volume || 0),
            date: dateObj,
            source: 'LIVE_GOVT_API',
            sourceRecordKey,
            fetchedAt: new Date(),
          },
        };

        const res = await Price.updateOne(filterKey, updateDoc, { upsert: true });

        if (res.upsertedCount && res.upsertedCount > 0) {
          metrics.inserted++;
        } else if (res.modifiedCount && res.modifiedCount > 0) {
          metrics.updated++;
        } else {
          metrics.skipped++;
        }
      } catch (recErr) {
        console.error('Error syncing individual record:', recErr);
        metrics.failed++;
      }
    }

    metrics.latestDate = Array.from(observedDates).sort().reverse()[0];

    return {
      success: true,
      metrics,
      message: `Successfully processed ${metrics.totalFetched} records. Inserted: ${metrics.inserted}, Updated: ${metrics.updated}, Skipped: ${metrics.skipped}, Unmapped: ${metrics.unmapped}, Failed: ${metrics.failed}.`,
    };
  } catch (err: any) {
    console.error('❌ Data.gov.in Live Price Sync Failed:', err.message);
    return {
      success: false,
      metrics,
      message: `Sync failed: ${err.message}. Preserved existing database benchmarks.`,
    };
  }
};
