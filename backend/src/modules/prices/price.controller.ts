import { Request, Response, NextFunction } from 'express';
import { Price } from './price.model';
import { syncLiveGovPrices } from './dataGov.service';

export const getPrices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketIds, commodity, commodityId, startDate, endDate, source } = req.query;

    let query: any = {};

    if (marketIds) {
      const ids = (marketIds as string).split(',').filter(Boolean);
      if (ids.length > 0) {
        query.marketId = { $in: ids };
      }
    }

    const rawComm = ((commodity || commodityId) as string) || '';
    if (rawComm) {
      // Strip ID suffixes like _1, _2 and descriptors like "Red " to match DB commodity string
      const cleanComm = rawComm
        .replace(/_\d+$/, '')
        .replace(/^(red|yellow|sharbati|hard|green)\s+/i, '')
        .trim();
      query.commodity = new RegExp(cleanComm, 'i');
    }

    if (source) {
      query.source = source;
    }

    // Exclude invalid records unless explicitly requested for audit
    if (req.query.includeInvalid !== 'true') {
      query.validationStatus = { $ne: 'INVALID' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Sort by date descending (newest first)
    const rawPrices = await Price.find(query)
      .populate('marketId', 'name state district location')
      .sort({ date: -1 })
      .limit(300);

    // Prioritize LIVE_GOVT_API records over SEEDED_HISTORICAL_BENCHMARK for each market + commodity (Part 9)
    const prioritizedMap = new Map<string, any>();
    for (const p of rawPrices) {
      const mId = typeof p.marketId === 'object' && p.marketId ? (p.marketId as any)._id?.toString() : String(p.marketId);
      const key = `${mId}_${p.commodity.toLowerCase()}`;
      const existing = prioritizedMap.get(key);
      if (!existing) {
        prioritizedMap.set(key, p);
      } else if (existing.source !== 'LIVE_GOVT_API' && p.source === 'LIVE_GOVT_API') {
        prioritizedMap.set(key, p);
      }
    }
    const prices = Array.from(prioritizedMap.values());

    const hasLiveRecords = prices.some((p) => p.source === 'LIVE_GOVT_API');
    const latestRecord = prices[0];

    res.status(200).json({
      success: true,
      meta: {
        totalRecords: prices.length,
        hasLiveGovData: hasLiveRecords,
        provenanceLabel: hasLiveRecords
          ? 'Latest Government Mandi Data (Data.gov.in)'
          : 'Verified Historical APMC Benchmark Data',
        latestDate: latestRecord?.date || null,
      },
      data: prices,
    });
  } catch (err) {
    next(err);
  }
};

export const triggerPriceSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { state = 'Maharashtra', limit = 200 } = req.body || {};

    const syncResult = await syncLiveGovPrices(state, Number(limit));

    res.status(syncResult.success ? 200 : 502).json({
      success: syncResult.success,
      message: syncResult.message,
      metrics: syncResult.metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
