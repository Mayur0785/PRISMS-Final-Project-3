import { Request, Response, NextFunction } from 'express';
import { FPO } from './fpo.model';
import { FpoMembership } from './fpoMembership.model';
import { GroupHarvestPool, IGroupHarvestPool } from './pool.model';
import { Lot } from '../lots/lot.model';
import { Price } from '../prices/price.model';
import { Buyer } from '../buyers/buyer.model';
import { BuyerDemand } from '../buyers/buyerDemand.model';
import { VEHICLE_CAPACITIES } from '../netEarning/netEarning.controller';
import mongoose from 'mongoose';

async function generatePoolId(): Promise<string> {
  const count = await GroupHarvestPool.countDocuments();
  const hex = (count + 701).toString(16).toUpperCase().padStart(4, '0');
  return `POOL-2026-${hex}`;
}

export const getAllFpos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fpos = await FPO.find().sort({ memberCount: -1 });
    res.status(200).json({
      success: true,
      count: fpos.length,
      data: fpos,
    });
  } catch (err) {
    next(err);
  }
};

export const getFpoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fpo = await FPO.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { fpoId: id }],
    });

    if (!fpo) {
      return res.status(404).json({
        success: false,
        error: { code: 'FPO_NOT_FOUND', message: 'FPO profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: fpo,
    });
  } catch (err) {
    next(err);
  }
};

export const joinFpo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const fpo = await FPO.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { fpoId: id }],
    });

    if (!fpo) {
      return res.status(404).json({
        success: false,
        error: { code: 'FPO_NOT_FOUND', message: 'FPO not found' },
      });
    }

    let membership = await FpoMembership.findOne({ fpoId: fpo.fpoId, farmerId: userId });
    if (!membership) {
      membership = await FpoMembership.create({
        fpoId: fpo.fpoId,
        farmerId: userId,
        memberRole: 'MEMBER',
        status: 'ACTIVE',
        isDemo: true,
      });

      fpo.memberCount += 1;
      await fpo.save();
    }

    res.status(200).json({
      success: true,
      data: {
        fpo,
        membership,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getFpoMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fpo = await FPO.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { fpoId: id }],
    });

    if (!fpo) {
      return res.status(404).json({ success: false, error: { code: 'FPO_NOT_FOUND', message: 'FPO not found' } });
    }

    const members = await FpoMembership.find({ fpoId: fpo.fpoId }).populate('farmerId', 'name email village phone');

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (err) {
    next(err);
  }
};

/** Create a new Group Harvest Pool for an FPO */
export const createHarvestPool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { fpoId, crop, variety, grade, targetMarket } = req.body;

    if (!crop) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Crop name is required for pool creation.' },
      });
    }

    const poolId = await generatePoolId();

    const pool = await GroupHarvestPool.create({
      poolId,
      fpoId: fpoId || 'FPO-2026-0001',
      crop,
      variety: variety || 'Garwa',
      grade: grade || 'Grade A',
      totalQuantityQtl: 0,
      targetMarket: targetMarket || 'Lasalgaon APMC / Direct Commercial Buyer',
      farmerContributions: [],
      poolingStatus: 'OPEN',
      isDemo: true,
    });

    res.status(201).json({
      success: true,
      data: pool,
    });
  } catch (err) {
    next(err);
  }
};

/** Contribute a farmer's lot to a Group Harvest Pool */
export const contributeToPool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const userName = (req as any).user.name || 'Farmer Member';
    const { id } = req.params;
    const { lotId, quantityQtl } = req.body;

    const pool = await GroupHarvestPool.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { poolId: id }],
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: { code: 'POOL_NOT_FOUND', message: 'Group harvest pool not found' },
      });
    }

    const lot = await Lot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(lotId) ? lotId : null }, { lotId }],
      userId,
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found or unauthorized' },
      });
    }

    // Verify Crop compatibility
    if (!lot.cropName.toLowerCase().includes(pool.crop.toLowerCase()) && !pool.crop.toLowerCase().includes(lot.cropName.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CROP_INCOMPATIBLE',
          message: `Incompatible crop! Pool requires ${pool.crop}, but lot commodity is ${lot.cropName}.`,
        },
      });
    }

    const contribQty = quantityQtl ? Number(quantityQtl) : lot.quantityQtl;

    // Check if farmer already contributed this lot
    const existingIndex = pool.farmerContributions.findIndex(
      c => c.farmerId.toString() === userId.toString() || (c.lotId && c.lotId.toString() === lot._id.toString())
    );

    if (existingIndex >= 0) {
      pool.farmerContributions[existingIndex].quantityQtl = contribQty;
    } else {
      pool.farmerContributions.push({
        farmerId: userId as any,
        farmerName: userName,
        quantityQtl: contribQty,
        lotId: lot._id as any,
        contributionPercent: 0,
        joinedAt: new Date(),
      });
    }

    // Recalculate total quantity & proportional contribution percentages
    const newTotal = pool.farmerContributions.reduce((sum, c) => sum + c.quantityQtl, 0);
    pool.totalQuantityQtl = newTotal;

    for (const c of pool.farmerContributions) {
      c.contributionPercent = parseFloat(((c.quantityQtl / newTotal) * 100).toFixed(2));
    }

    await pool.save();

    res.status(200).json({
      success: true,
      data: pool,
    });
  } catch (err) {
    next(err);
  }
};

/** Get all pools */
export const getPools = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fpoId } = req.query;
    const query: any = {};
    if (fpoId) query.fpoId = fpoId;

    const pools = await GroupHarvestPool.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pools.length,
      data: pools,
    });
  } catch (err) {
    next(err);
  }
};

/** Calculate Collective Vehicle Transport Optimization & Proportional Savings */
export const getPoolTransportOptimization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const distKm = Number(req.query.distKm) || 25; // Default ~25 km to regional market

    const pool = await GroupHarvestPool.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { poolId: id }],
    });

    if (!pool) {
      return res.status(404).json({ success: false, error: { code: 'POOL_NOT_FOUND', message: 'Pool not found' } });
    }

    const totalQty = pool.totalQuantityQtl || 10;

    // 1. Calculate Individual Freight Costs (if each farmer shipped separately)
    const farmerBreakdown = [];
    let totalIndividualSum = 0;

    for (const contrib of pool.farmerContributions) {
      const q = contrib.quantityQtl;
      // Individual vehicle required for single farmer's quantity
      let indVehicle = 'small_pickup';
      if (q > 80) indVehicle = 'large_truck';
      else if (q > 50) indVehicle = 'mini_truck';
      else if (q > 30) indVehicle = 'tata_407';
      else if (q > 10) indVehicle = 'medium_pickup';

      const indCap = VEHICLE_CAPACITIES[indVehicle] || 30;
      const indTrips = Math.max(1, Math.ceil(q / indCap));
      const indFreight = Math.round(distKm * 1.35 * q);
      const indLabour = Math.round(500 * indTrips);
      const indTotal = indFreight + indLabour;

      totalIndividualSum += indTotal;

      farmerBreakdown.push({
        farmerId: contrib.farmerId,
        farmerName: contrib.farmerName || 'Farmer Member',
        quantityQtl: q,
        sharePercent: contrib.contributionPercent,
        individualVehicle: indVehicle,
        individualFreight: indFreight,
        individualLabour: indLabour,
        individualTotalCost: indTotal,
      });
    }

    // 2. Select Optimal Collective Vehicle for Total Pooled Quantity
    const vehicleOptions = [
      { key: 'small_pickup', name: 'Chhota Hathi (10 Qtl)', capacity: 10 },
      { key: 'medium_pickup', name: 'Bolero MaxiTruck (30 Qtl)', capacity: 30 },
      { key: 'tata_407', name: 'Tata 407 / Eicher (50 Qtl)', capacity: 50 },
      { key: 'mini_truck', name: '6-Wheeler Mini Truck (80 Qtl)', capacity: 80 },
      { key: 'large_truck', name: 'Multi-Axle Heavy Truck (150 Qtl)', capacity: 150 },
    ];

    let bestCollectiveVehicle = vehicleOptions[1];
    let minCollectiveCost = Infinity;
    let bestTrips = 1;
    let bestFreight = 0;
    let bestLabour = 0;

    for (const veh of vehicleOptions) {
      const trips = Math.max(1, Math.ceil(totalQty / veh.capacity));
      const freight = Math.round(distKm * 1.35 * totalQty);
      const labour = Math.round(500 * trips);
      const totalCost = freight + labour;

      if (totalCost < minCollectiveCost) {
        minCollectiveCost = totalCost;
        bestCollectiveVehicle = veh;
        bestTrips = trips;
        bestFreight = freight;
        bestLabour = labour;
      }
    }

    // 3. Divide Collective Freight Proportions strictly by Contribution Share %
    const allocatedFarmers = farmerBreakdown.map(f => {
      const shareFraction = f.sharePercent / 100;
      const allocatedCollectiveCost = Math.round(minCollectiveCost * shareFraction);
      const savings = Math.max(0, f.individualTotalCost - allocatedCollectiveCost);
      const savingsPercent = f.individualTotalCost > 0 ? parseFloat(((savings / f.individualTotalCost) * 100).toFixed(1)) : 0;

      return {
        ...f,
        allocatedCollectiveCost,
        savings,
        savingsPercent,
      };
    });

    const totalGroupSavings = Math.max(0, totalIndividualSum - minCollectiveCost);

    res.status(200).json({
      success: true,
      data: {
        poolId: pool.poolId,
        crop: pool.crop,
        totalQuantityQtl: totalQty,
        distanceKm: distKm,
        individualCombinedCost: totalIndividualSum,
        collective: {
          recommendedVehicle: bestCollectiveVehicle.name,
          vehicleKey: bestCollectiveVehicle.key,
          capacityQtl: bestCollectiveVehicle.capacity,
          tripsRequired: bestTrips,
          collectiveFreight: bestFreight,
          collectiveLabour: bestLabour,
          totalCollectiveCost: minCollectiveCost,
        },
        totalGroupSavings,
        savingsPercent: totalIndividualSum > 0 ? parseFloat(((totalGroupSavings / totalIndividualSum) * 100).toFixed(1)) : 0,
        farmerAllocations: allocatedFarmers,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Get Group Pool Market & Buyer Recommendations */
export const getPoolMarketRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await GroupHarvestPool.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { poolId: id }],
    });

    if (!pool) {
      return res.status(404).json({ success: false, error: { code: 'POOL_NOT_FOUND', message: 'Pool not found' } });
    }

    const totalQty = pool.totalQuantityQtl || 30;

    // 1. APMC Mandi Price Benchmark
    const priceDoc = await Price.findOne({
      commodity: new RegExp(`^${pool.crop}$`, 'i'),
    }).sort({ date: -1 });

    const modalPricePerQtl = priceDoc ? (priceDoc.modalPrice > 100 ? priceDoc.modalPrice : priceDoc.modalPrice * 100) : 2450;
    const mandiGross = Math.round(modalPricePerQtl * totalQty);
    const mandiFreight = Math.round(25 * 1.5 * totalQty);
    const mandiLabour = Math.round(500 * Math.ceil(totalQty / 50));
    const mandiSpoilage = Math.round(mandiGross * 0.08);
    const mandiFee = Math.round(mandiGross * 0.01);
    const mandiNet = mandiGross - mandiFreight - mandiLabour - mandiSpoilage - mandiFee;

    // 2. Commercial Buyer Match Benchmark
    const demand = await BuyerDemand.findOne({
      commodity: new RegExp(`^${pool.crop}$`, 'i'),
    });
    const buyer = demand ? await Buyer.findOne({ buyerId: demand.buyerId }) : null;

    const buyerPricePerQtl = demand ? demand.targetPriceMax : Math.round(modalPricePerQtl * 1.12);
    const buyerGross = Math.round(buyerPricePerQtl * totalQty);
    const buyerFreight = Math.round(25 * 1.35 * totalQty);
    const buyerHandling = Math.round(buyerGross * 0.005);
    const buyerSpoilage = Math.round(buyerGross * 0.015);
    const buyerNet = buyerGross - buyerFreight - buyerHandling - buyerSpoilage;

    const recommendedChannel = buyerNet >= mandiNet ? 'COMMERCIAL_BUYER' : 'APMC_MANDI';

    res.status(200).json({
      success: true,
      data: {
        poolId: pool.poolId,
        crop: pool.crop,
        totalQuantityQtl: totalQty,
        recommendedChannel,
        bestMandi: {
          mandiName: 'Lasalgaon APMC (Nashik)',
          modalPricePerQtl,
          grossRevenue: mandiGross,
          totalLogisticsAndFees: mandiFreight + mandiLabour + mandiSpoilage + mandiFee,
          estimatedNetRealization: mandiNet,
        },
        bestBuyer: buyer ? {
          businessName: buyer.businessName,
          buyerType: buyer.buyerType,
          quotedPricePerQtl: buyerPricePerQtl,
          grossRevenue: buyerGross,
          totalLogisticsAndFees: buyerFreight + buyerHandling + buyerSpoilage,
          estimatedNetRealization: buyerNet,
        } : {
          businessName: 'Nashik Agro Processors Ltd. (Demo Buyer)',
          buyerType: 'Processor',
          quotedPricePerQtl: buyerPricePerQtl,
          grossRevenue: buyerGross,
          totalLogisticsAndFees: buyerFreight + buyerHandling + buyerSpoilage,
          estimatedNetRealization: buyerNet,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
