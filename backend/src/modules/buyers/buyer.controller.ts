import { Request, Response, NextFunction } from 'express';
import { Buyer } from './buyer.model';
import { BuyerDemand } from './buyerDemand.model';

export const getBuyers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commodity, district, buyerType, grade } = req.query;

    const query: any = {};
    if (district) {
      query.district = new RegExp(`^${district}$`, 'i');
    }
    if (buyerType) {
      query.buyerType = buyerType;
    }
    if (commodity) {
      query.cropsInterested = new RegExp(commodity as string, 'i');
    }
    if (grade) {
      query.preferredGrades = new RegExp(grade as string, 'i');
    }

    const buyers = await Buyer.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: buyers.length,
      data: buyers,
    });
  } catch (err) {
    next(err);
  }
};

export const getBuyerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buyer = await Buyer.findOne({ buyerId: req.params.id }) || await Buyer.findById(req.params.id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUYER_NOT_FOUND', message: 'Buyer profile not found' },
      });
    }

    const demands = await BuyerDemand.find({ buyerId: buyer.buyerId, demandStatus: 'ACTIVE' });

    res.status(200).json({
      success: true,
      data: {
        buyer,
        activeDemands: demands,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchBuyers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      const all = await Buyer.find({}).limit(20);
      return res.status(200).json({ success: true, count: all.length, data: all });
    }

    const regex = new RegExp(q, 'i');
    const buyers = await Buyer.find({
      $or: [
        { businessName: regex },
        { district: regex },
        { location: regex },
        { cropsInterested: regex },
        { buyerType: regex },
      ],
    }).limit(20);

    res.status(200).json({
      success: true,
      count: buyers.length,
      data: buyers,
    });
  } catch (err) {
    next(err);
  }
};

export const getBuyerDemands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commodity, buyerId, grade, status } = req.query;

    const query: any = {};
    if (commodity) {
      query.commodity = new RegExp(commodity as string, 'i');
    }
    if (buyerId) {
      query.buyerId = buyerId;
    }
    if (grade) {
      query.requiredGrade = new RegExp(grade as string, 'i');
    }
    if (status) {
      query.demandStatus = status;
    }

    const demands = await BuyerDemand.find(query).sort({ createdAt: -1 });
    
    // Attach buyer metadata
    const buyerIds = [...new Set(demands.map((d) => d.buyerId))];
    const buyersMap = new Map();
    const buyersList = await Buyer.find({ buyerId: { $in: buyerIds } });
    buyersList.forEach((b) => buyersMap.set(b.buyerId, b));

    const enrichedDemands = demands.map((d) => {
      const buyer = buyersMap.get(d.buyerId);
      return {
        ...d.toObject(),
        buyer: buyer ? {
          businessName: buyer.businessName,
          buyerType: buyer.buyerType,
          district: buyer.district,
          location: buyer.location,
          isDemo: buyer.isDemo,
          verificationStatus: buyer.verificationStatus,
        } : {
          businessName: d.buyerId.includes('@') ? `Buyer (${d.buyerId.split('@')[0]})` : d.buyerId,
          buyerType: 'Commercial Buyer',
          district: d.preferredDistricts?.[0] || 'Maharashtra',
          location: 'Hub',
          isDemo: d.isDemo,
          verificationStatus: 'VERIFIED',
        },
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedDemands.length,
      data: enrichedDemands,
    });
  } catch (err) {
    next(err);
  }
};

export const createBuyerDemand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    const userEmail = (req as any).user?.email;
    const userName = (req as any).user?.name;
    const buyerId = userEmail || userName || String(rawUserId);

    const {
      commodity,
      variety,
      targetGrade,
      quantityRequiredQtl,
      targetPriceMin,
      targetPriceMax,
      preferredDistricts,
      deliveryPreference,
      deliveryLocation,
      notes,
    } = req.body;

    const count = await BuyerDemand.countDocuments();
    const hex = (count + 101).toString(16).toUpperCase().padStart(4, '0');
    const demandId = `DEM-2026-${hex}`;

    const numQty = Number(quantityRequiredQtl) || 50;
    const numPriceMin = Number(targetPriceMin) || 2800;
    const numPriceMax = Number(targetPriceMax) || 3200;

    const newDemand = await BuyerDemand.create({
      demandId,
      buyerId,
      commodity,
      variety: variety || 'Standard',
      requiredGrade: targetGrade || 'Grade A',
      targetGrade: targetGrade || 'Grade A',
      quantityRequiredQtl: numQty,
      minQuantityQtl: Math.round(numQty * 0.2),
      maxQuantityQtl: numQty,
      targetPriceMin: numPriceMin,
      targetPriceMax: numPriceMax,
      preferredDistricts: Array.isArray(preferredDistricts) ? preferredDistricts : [preferredDistricts || 'Nashik'],
      deliveryPreference: deliveryPreference || 'Buyer Pickup',
      deliveryLocation: deliveryLocation || 'Mandi Yard / Warehouse',
      urgency: 'HIGH',
      demandStatus: 'ACTIVE',
      status: 'ACTIVE',
      isDemo: false,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Buyer procurement demand created successfully',
      data: newDemand,
    });
  } catch (err) {
    next(err);
  }
};

export const getBuyerDemandById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id);

    if (!demand) {
      return res.status(404).json({
        success: false,
        error: { code: 'DEMAND_NOT_FOUND', message: 'Buyer demand not found' },
      });
    }

    const buyer = await Buyer.findOne({ buyerId: demand.buyerId });

    res.status(200).json({
      success: true,
      data: {
        demand,
        buyer,
      },
    });
  } catch (err) {
    next(err);
  }
};
