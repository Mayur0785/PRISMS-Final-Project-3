import { Request, Response, NextFunction } from 'express';
import { Price } from '../prices/price.model';
import { Buyer } from '../buyers/buyer.model';
import { BuyerDemand } from '../buyers/buyerDemand.model';

/** 1. Storage & Cold Storage Recommendation */
export const getStorageRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropName, quantityQtl, holdingDays, tempCelsius, humidityPercent } = req.query;
    const crop = (cropName as string || 'Red Onion').toLowerCase();
    const days = parseInt(holdingDays as string, 10) || 14;
    const temp = tempCelsius ? parseFloat(tempCelsius as string) : 28;
    const humidity = humidityPercent ? parseFloat(humidityPercent as string) : 75;

    let recommendedAction: 'SELL QUICKLY' | 'AMBIENT STORAGE' | 'COLD STORAGE' | 'COVERED TRANSPORT' = 'AMBIENT STORAGE';
    let spoilageRate = 2.0;
    let holdWindow = '10-14';
    let priceGain = 240;
    let monthlyStorageCost = 45;
    const reasons: string[] = [];

    if (crop.includes('tomato') || crop.includes('banana') || crop.includes('papaya')) {
      if (days > 3) {
        recommendedAction = 'COLD STORAGE';
        spoilageRate = 4.2;
        holdWindow = '10-14';
        priceGain = 380;
        monthlyStorageCost = 120;
        reasons.push(`Highly perishable produce (${cropName || 'Tomato'}) develops rapid decay beyond 3 days under ambient temperature (${temp}°C).`);
        reasons.push(`Controlled cold storage at 10–13°C preserves firmness and extends market window by up to 14 days.`);
      } else {
        recommendedAction = 'SELL QUICKLY';
        spoilageRate = 5.5;
        holdWindow = '2-3';
        priceGain = 120;
        monthlyStorageCost = 0;
        reasons.push(`Immediate market dispatch recommended to maximize freshness and avoid price discounting.`);
      }
    } else if (crop.includes('onion') || crop.includes('potato')) {
      if (days > 30) {
        recommendedAction = 'COLD STORAGE';
        spoilageRate = 2.5;
        holdWindow = '30-45';
        priceGain = 450;
        monthlyStorageCost = 90;
        reasons.push(`Long-term storage (>30 days) requires controlled atmospheric cold storage to prevent sprouting and weight loss.`);
      } else {
        recommendedAction = 'AMBIENT STORAGE';
        spoilageRate = 3.2;
        holdWindow = '10-14';
        priceGain = 240;
        monthlyStorageCost = 45;
        reasons.push(`Well-ventilated ambient storage (Garwa structure) is cost-effective for up to 30 days.`);
      }
    } else {
      recommendedAction = 'AMBIENT STORAGE';
      spoilageRate = 0.8;
      holdWindow = '30-60';
      priceGain = 180;
      monthlyStorageCost = 25;
      reasons.push(`Dry grain/pulse crop (${cropName || 'Wheat'}) has low perishability when stored at <12% moisture.`);
    }

    res.status(200).json({
      success: true,
      data: {
        cropName: cropName || 'Red Onion',
        quantityQtl: Number(quantityQtl) || 30,
        holdingDays: days,
        recommendedHoldDays: holdWindow,
        expectedPriceGain: priceGain,
        spoilageRiskPercent: parseFloat(spoilageRate.toFixed(1)),
        estimatedStorageCostPerMonth: monthlyStorageCost,
        recommendedAction,
        ambientWeather: { tempCelsius: temp, humidityPercent: humidity, note: 'Open-Meteo ambient benchmark' },
        reasons,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** 2. Sell Now vs Wait Recommendation Engine */
export const getSaleWindowRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropName, currentPrice, targetPrice, spoilageRiskPercent } = req.query;
    const crop = (cropName as string || 'Red Onion').toLowerCase();
    const currPrice = Number(currentPrice) || 2800;
    const target = Number(targetPrice) || 3200;
    const spoilageRisk = Number(spoilageRiskPercent) || 3.5;

    let recommendation: 'SELL_NOW' | 'WAIT' | 'WATCH' = 'WAIT';
    const confidence = 'Rule-based Estimate';
    const reasons: string[] = [];
    const risks: string[] = [];

    const priceGapPercent = ((target - currPrice) / currPrice) * 100;

    if (spoilageRisk >= 8.0 || crop.includes('banana')) {
      recommendation = 'SELL_NOW';
      reasons.push(`Perishability risk (${spoilageRisk}%) outweighs potential short-term price upside.`);
      reasons.push(`Current market price ₹${currPrice}/Qtl offers strong baseline net realization.`);
      risks.push(`Delaying sale risks quality downgrades and weight loss.`);
    } else if (priceGapPercent > 5.0 && spoilageRisk < 5.0) {
      recommendation = 'WAIT';
      reasons.push(`Price trend indicates target ₹${target}/Qtl is reachable within 10–14 days (+${priceGapPercent.toFixed(1)}% upside).`);
      reasons.push(`Low spoilage risk (${spoilageRisk}%) allows safe holding in ambient storage.`);
      risks.push(`Monitor regional market arrivals daily for sudden supply surges.`);
    } else {
      recommendation = 'WATCH';
      reasons.push(`Current price ₹${currPrice}/Qtl is close to target. Market signal is neutral.`);
      risks.push(`Price fluctuation risk ±3% over the next 5 days.`);
    }

    res.status(200).json({
      success: true,
      data: {
        cropName: cropName || 'Red Onion',
        currentPrice: currPrice,
        targetPrice: target,
        recommendation,
        confidence,
        planningHorizon: '10–14 days',
        reasons,
        risks,
        disclaimer: 'PRISMS Planning Signal — Decision support rule based on target price and produce perishability.',
      },
    });
  } catch (err) {
    next(err);
  }
};

/** 3. Deterministic Risk Scoring Engine */
export const getRiskScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropName, transitDistanceKm, spoilagePercent, priceVolatilityPercent } = req.query;
    const dist = Number(transitDistanceKm) || 35;
    const spoilage = Number(spoilagePercent) || 3.5;
    const volatility = Number(priceVolatilityPercent) || 5.0;

    // Deterministic Risk Score Math (0 - 100)
    const distanceRisk = Math.min(30, (dist / 200) * 30);
    const spoilageRisk = Math.min(40, (spoilage / 15) * 40);
    const volatilityRisk = Math.min(30, (volatility / 20) * 30);

    const totalRiskScore = Math.round(distanceRisk + spoilageRisk + volatilityRisk);
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = totalRiskScore >= 65 ? 'HIGH' : totalRiskScore >= 35 ? 'MEDIUM' : 'LOW';

    const riskFactors = [
      `Spoilage Risk: ${spoilage.toFixed(1)}% (${spoilageRisk.toFixed(1)}/40 factor score)`,
      `Transit Distance Risk: ${dist} km (${distanceRisk.toFixed(1)}/30 factor score)`,
      `Market Volatility Risk: ${volatility}% (${volatilityRisk.toFixed(1)}/30 factor score)`,
    ];

    res.status(200).json({
      success: true,
      data: {
        cropName: cropName || 'Red Onion',
        totalRiskScore,
        riskLevel,
        spoilageRiskPercent: spoilage,
        transitDistanceKm: dist,
        marketVolatilityPercent: volatility,
        riskFactors,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** 4. Explainable AI Engine ("Why this Market / Buyer?") */
export const getRecommendationExplanation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recommendationType, marketName, buyerName, netRealization, pricePerQtl, distanceKm } = req.query;
    const type = (recommendationType as string || 'WHY_THIS_BUYER').toUpperCase();

    let title = 'Explainable Decision Rationale';
    let summary = '';
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (type === 'WHY_THIS_MARKET') {
      title = `Why ${marketName || 'Lasalgaon APMC'} is Recommended?`;
      summary = `Evaluated using PRISMS Net Realization Engine comparing gross value against logistics, mandi cess, and spoilage losses.`;
      positiveFactors.push(`High modal price of ₹${pricePerQtl || 2850}/Qtl.`);
      positiveFactors.push(`Highest net take-home realization (₹${netRealization || '92,400'}).`);
      positiveFactors.push(`High buyer liquidity and bulk auction volume.`);
      negativeFactors.push(`Transport freight charge for ${distanceKm || 25} km transit.`);
      negativeFactors.push(`Standard APMC mandi handling & cess charges.`);
    } else if (type === 'WHY_THIS_BUYER') {
      title = `Why ${buyerName || 'Nashik Agro Processors'} is Recommended?`;
      summary = `Matched using PRISMS Buyer Demand Engine based on direct contract price, zero mandi commission, and direct farmgate pickup.`;
      positiveFactors.push(`Direct buyer price offer of ₹${pricePerQtl || 3200}/Qtl (${netRealization ? `₹${netRealization} Net` : '+12% over mandi'}).`);
      positiveFactors.push(`Zero APMC Mandi Commission (saves 1.0% fees).`);
      positiveFactors.push(`Lower spoilage loss during direct farmgate pickup (1.5% vs 8.0% mandi loss).`);
      positiveFactors.push(`Demo payment workflow assumes settlement after delivery confirmation.`);
      negativeFactors.push(`Requires quality grade verification (Grade A requirement).`);
    } else if (type === 'WHY_SELL_NOW') {
      title = `Why Sell Now vs Hold?`;
      summary = `Evaluated using perishability decay models and current mandi price momentum.`;
      positiveFactors.push(`Current market price offers strong baseline net realization without holding costs.`);
      positiveFactors.push(`Avoids storage degradation risk and weight loss over time.`);
      negativeFactors.push(`Foregoes potential upside if market price surges later.`);
    } else if (type === 'WHY_COLD_STORAGE') {
      title = `Why Cold Storage is Recommended?`;
      summary = `Evaluated by comparing monthly holding cost against projected seasonal price appreciation.`;
      positiveFactors.push(`Reduces produce spoilage rate from 8.5% down to 2.5%.`);
      positiveFactors.push(`Extends marketable sales window by 30–45 days.`);
      positiveFactors.push(`Expected net price gain of +₹240/Qtl exceeds monthly storage cost.`);
      negativeFactors.push(`Requires upfront logistics & monthly storage rental fees.`);
    } else {
      title = `Decision Support Rationale`;
      summary = `Multi-factorial evaluation of market prices, logistics cost, and produce shelf-life.`;
      positiveFactors.push(`Favorable selling window benchmark.`);
      negativeFactors.push(`Monitor regional market arrivals.`);
    }

    res.status(200).json({
      success: true,
      data: {
        recommendationType: type,
        title,
        summary,
        positiveFactors,
        negativeFactors,
        calculationReference: 'PRISMS Authoritative Net Realization Formula (Gross - Transport - Labour - Spoilage - Fees)',
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
};

