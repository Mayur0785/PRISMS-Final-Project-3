import { Request, Response, NextFunction } from 'express';
import { Offer, IOffer } from './offer.model';
import { Lot } from '../lots/lot.model';
import { Buyer } from '../buyers/buyer.model';
import { BuyerDemand } from '../buyers/buyerDemand.model';
import { Transaction } from '../transactions/transaction.model';
import mongoose from 'mongoose';

async function generateOfferId(): Promise<string> {
  const count = await Offer.countDocuments();
  const hex = (count + 201).toString(16).toUpperCase().padStart(4, '0');
  return `OFR-2026-${hex}`;
}

/** Deterministic demo offer generator for a published trade lot */
export async function ensureDemoOffersForLot(lot: any) {
  const existingCount = await Offer.countDocuments({ lotId: lot._id });
  if (existingCount > 0) return;

  // Try to find matching buyer demands (case-insensitive, partial crop name match)
  const cropName = (lot.cropName || '').trim();
  const demands = await BuyerDemand.find({
    $or: [
      { commodity: new RegExp(`^${cropName}$`, 'i') },
      { commodity: new RegExp(cropName, 'i') },
    ],
    demandStatus: 'ACTIVE',
  }).limit(6);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  const seededOffers: any[] = [];
  const buyerIds = [...new Set(demands.map((d: any) => d.buyerId))];
  const buyers = await Buyer.find({ buyerId: { $in: buyerIds } });
  const buyersMap = new Map(buyers.map((b: any) => [b.buyerId, b]));

  for (let i = 0; i < demands.length && i < 3; i++) {
    const demand = demands[i] as any;
    const buyer = buyersMap.get(demand.buyerId) as any;
    if (!buyer) continue;

    const offerId = await generateOfferId();
    const priceVariance = i === 0 ? 100 : i === 1 ? 250 : -100;
    const pricePerQtl = Math.min(
      demand.targetPriceMax,
      Math.max(demand.targetPriceMin, (lot.expectedPricePerQtl || 3000) + priceVariance)
    );
    const qty = lot.quantityQtl || 25;
    const grossValue = Math.round(pricePerQtl * qty);
    const distKm = buyer.district && lot.district &&
      buyer.district.toLowerCase() === (lot.district || 'nashik').toLowerCase() ? 20 : 185;
    const estimatedTransportCost = Math.round(distKm * 1.35 * qty);
    const estimatedMarketHandlingCharges = Math.round(grossValue * 0.005);
    const estimatedSpoilage = Math.round(grossValue * 0.015);
    const estimatedNetRealization = grossValue - estimatedTransportCost - estimatedMarketHandlingCharges - estimatedSpoilage;

    seededOffers.push({
      offerId,
      lotId: lot._id,
      buyerId: buyer.buyerId,
      sellerUserId: lot.userId,
      commodity: lot.cropName,
      variety: lot.variety || 'Standard',
      grade: lot.grade || 'Grade A',
      quantityQtl: qty,
      pricePerQtl,
      grossValue,
      estimatedTransportCost,
      estimatedLabourCost: 0,
      estimatedSpoilage,
      estimatedMarketHandlingCharges,
      estimatedNetRealization,
      paymentTerms: buyer.paymentTerms || 'T+1 Direct Bank Transfer (Simulated Escrow)',
      deliveryTerms: buyer.deliveryPreference || 'Buyer Pickup',
      pickupLocation: lot.origin || 'Farm Gate',
      deliveryLocation: demand.deliveryLocation || `${buyer.location}, ${buyer.district}`,
      expiresAt: expiryDate,
      offerStatus: 'PENDING',
      isDemo: true,
    });
  }

  // Fallback: If no matching demands found, generate generic offers using the first available buyers
  if (seededOffers.length === 0) {
    const fallbackBuyers = await Buyer.find({ isDemo: true }).limit(3);
    const basePrice = lot.expectedPricePerQtl || 3000;
    const qty = lot.quantityQtl || 25;

    for (let i = 0; i < fallbackBuyers.length; i++) {
      const buyer = fallbackBuyers[i] as any;
      const offerId = await generateOfferId();
      const priceVariance = [100, 250, -100][i] || 0;
      const pricePerQtl = Math.round(basePrice + priceVariance);
      const grossValue = Math.round(pricePerQtl * qty);
      const distKm = buyer.district && lot.district &&
        buyer.district.toLowerCase() === (lot.district || 'nashik').toLowerCase() ? 20 : 185;
      const estimatedTransportCost = Math.round(distKm * 1.35 * qty);
      const estimatedMarketHandlingCharges = Math.round(grossValue * 0.005);
      const estimatedSpoilage = Math.round(grossValue * 0.015);
      const estimatedNetRealization = grossValue - estimatedTransportCost - estimatedMarketHandlingCharges - estimatedSpoilage;

      seededOffers.push({
        offerId,
        lotId: lot._id,
        buyerId: buyer.buyerId,
        sellerUserId: lot.userId,
        commodity: lot.cropName,
        variety: lot.variety || 'Standard',
        grade: lot.grade || 'Grade A',
        quantityQtl: qty,
        pricePerQtl,
        grossValue,
        estimatedTransportCost,
        estimatedLabourCost: 0,
        estimatedSpoilage,
        estimatedMarketHandlingCharges,
        estimatedNetRealization,
        paymentTerms: buyer.paymentTerms || 'T+1 Direct Bank Transfer (Simulated Escrow)',
        deliveryTerms: buyer.deliveryPreference || 'Buyer Pickup',
        pickupLocation: lot.origin || 'Farm Gate',
        deliveryLocation: `${buyer.location || 'Market Yard'}, ${buyer.district || 'Nashik'}`,
        expiresAt: expiryDate,
        offerStatus: 'PENDING',
        isDemo: true,
      });
    }
  }

  if (seededOffers.length > 0) {
    await Offer.insertMany(seededOffers);
  }
}

export const getUserOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const offers = await Offer.find({ sellerUserId: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (err) {
    next(err);
  }
};

export const getOffersForLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { lotId } = req.params;

    const lot = await Lot.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(lotId) ? lotId : null },
        { lotId },
      ],
      $and: [{
        $or: [
          { userId: rawUserId },
          { userId: userIdObj },
          { userId: String(rawUserId) },
        ]
      }],
    });

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found or unauthorized' },
      });
    }

    await ensureDemoOffersForLot(lot);

    const offers = await Offer.find({ lotId: lot._id as any }).sort({ estimatedNetRealization: -1 });

    // Populate buyer info
    const buyerIds = [...new Set(offers.map(o => o.buyerId))];
    const buyers = await Buyer.find({ buyerId: { $in: buyerIds } });
    const buyersMap = new Map(buyers.map(b => [b.buyerId, b]));

    const enrichedOffers = offers.map(o => {
      const buyer = buyersMap.get(o.buyerId);
      return {
        ...o.toObject(),
        buyer: buyer ? {
          businessName: buyer.businessName,
          buyerType: buyer.buyerType,
          district: buyer.district,
          location: buyer.location,
          isDemo: buyer.isDemo,
          verificationStatus: buyer.verificationStatus,
        } : null,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedOffers.length,
      data: enrichedOffers,
    });
  } catch (err) {
    next(err);
  }
};

export const acceptOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      sellerUserId: userId,
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'OFFER_NOT_FOUND', message: 'Digital offer not found or unauthorized' },
      });
    }

    if (offer.offerStatus === 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_ACCEPTED', message: 'This offer has already been accepted.' },
      });
    }

    if (offer.offerStatus === 'REJECTED' || offer.offerStatus === 'EXPIRED' || offer.offerStatus === 'WITHDRAWN') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OFFER_STATE', message: `Cannot accept offer with status ${offer.offerStatus}.` },
      });
    }

    // Check if lot already has another accepted offer
    const lot = await Lot.findById(offer.lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: { code: 'LOT_NOT_FOUND', message: 'Associated trade lot not found.' } });
    }

    if (lot.lotStatus === 'ACCEPTED' || lot.lotStatus === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: { code: 'LOT_ALREADY_TRADED', message: 'An offer has already been accepted for this trade lot.' },
      });
    }

    // 1. Mark offer as ACCEPTED
    offer.offerStatus = 'ACCEPTED';
    await offer.save();

    // 2. Reject all other pending/countered offers for the same lot
    await Offer.updateMany(
      { lotId: offer.lotId, _id: { $ne: offer._id }, offerStatus: { $in: ['PENDING', 'COUNTERED'] } },
      { $set: { offerStatus: 'REJECTED' } }
    );

    // 3. Update Lot status to ACCEPTED
    lot.lotStatus = 'ACCEPTED';
    await lot.save();

    // 4. Create Transaction record (State: OFFER_ACCEPTED)
    const countTxn = await Transaction.countDocuments();
    const txnHex = (countTxn + 301).toString(16).toUpperCase().padStart(4, '0');
    const transactionId = `TXN-2026-${txnHex}`;

    const totalDeductions = offer.estimatedTransportCost + offer.estimatedLabourCost + offer.estimatedSpoilage + offer.estimatedMarketHandlingCharges;

    const transaction = await Transaction.create({
      transactionId,
      lotId: offer.lotId as any,
      offerId: offer._id as any,
      farmerId: offer.sellerUserId as any,
      buyerId: offer.buyerId,
      crop: offer.commodity,
      variety: offer.variety,
      grade: offer.grade,
      quantityQtl: offer.quantityQtl,
      agreedPricePerQtl: offer.pricePerQtl,
      grossAmount: offer.grossValue,
      totalDeductions,
      finalNetAmount: offer.estimatedNetRealization,
      transactionStatus: 'OFFER_ACCEPTED',
      isDemo: true,
    });

    res.status(200).json({
      success: true,
      message: 'Offer accepted successfully. Trade execution transaction initiated.',
      data: {
        offer,
        transaction,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const rejectOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      sellerUserId: userId,
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'OFFER_NOT_FOUND', message: 'Digital offer not found or unauthorized' },
      });
    }

    if (offer.offerStatus === 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_REJECT_ACCEPTED', message: 'Cannot reject an accepted offer.' },
      });
    }

    offer.offerStatus = 'REJECTED';
    await offer.save();

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const counterOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    const { counterPricePerQtl, counterQuantityQtl, message } = req.body;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      sellerUserId: userId,
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'OFFER_NOT_FOUND', message: 'Digital offer not found or unauthorized' },
      });
    }

    if (offer.offerStatus !== 'PENDING' && offer.offerStatus !== 'COUNTERED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OFFER_STATE', message: 'Can only counter active pending offers.' },
      });
    }

    offer.offerStatus = 'COUNTERED';
    if (counterPricePerQtl) offer.counterPricePerQtl = counterPricePerQtl;
    if (counterQuantityQtl) offer.counterQuantityQtl = counterQuantityQtl;
    if (message) offer.counterMessage = message;
    await offer.save();

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      sellerUserId: userId,
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'OFFER_NOT_FOUND', message: 'Digital offer not found or unauthorized' },
      });
    }

    offer.offerStatus = 'WITHDRAWN';
    await offer.save();

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};
