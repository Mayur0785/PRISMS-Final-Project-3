import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Offer, IOffer } from './offer.model';
import { Lot } from '../lots/lot.model';
import { resolveLot } from '../lots/lot.helpers';
import { Buyer } from '../buyers/buyer.model';
import { BuyerDemand } from '../buyers/buyerDemand.model';
import { Transaction } from '../transactions/transaction.model';
import { DeliveryOrder } from '../delivery/delivery.model';
import { PaymentLedger } from '../payments/payment.model';
import { User } from '../users/user.model';
import { sendSystemNotification } from '../notifications/notification.controller';

export async function generateOfferId(): Promise<string> {
  const count = await Offer.countDocuments();
  const hex = (count + 201).toString(16).toUpperCase().padStart(4, '0');
  return `OFR-2026-${hex}`;
}

export const getUserOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let userEmail = (req as any).user.email;
    let userName = (req as any).user.name;
    if ((!userEmail || !userName) && mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u) {
        if (!userEmail && u.email) userEmail = u.email;
        if (!userName && u.name) userName = u.name;
      }
    }
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const orConditions: any[] = [
      { sellerUserId: rawUserId },
      { sellerUserId: userIdObj },
      { sellerUserId: String(rawUserId) },
      { buyerId: rawUserId },
      { buyerId: userIdObj },
      { buyerId: String(rawUserId) },
    ];
    if (userEmail) {
      orConditions.push({ buyerId: userEmail });
      orConditions.push({ sellerUserId: userEmail });
    }
    if (userName) orConditions.push({ buyerId: userName });

    const offers = await Offer.find({
      $or: orConditions,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (err) {
    next(err);
  }
};

export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let buyerEmail = (req as any).user.email;
    let buyerName = (req as any).user.name;
    if ((!buyerEmail || !buyerName) && mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u) {
        if (!buyerEmail && u.email) buyerEmail = u.email;
        if (!buyerName && u.name) buyerName = u.name;
      }
    }
    const buyerId = String(rawUserId);

    const { lotId, pricePerQtl, quantityQtl, paymentTerms, deliveryTerms, message } = req.body;

    if (!lotId || !pricePerQtl) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'lotId and pricePerQtl are required' },
      });
    }

    const lot = await resolveLot(lotId);

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Target trade lot not found' },
      });
    }

    const qty = Number(quantityQtl) || lot.quantityQtl || 30;
    const pPerQtl = Number(pricePerQtl);

    // Prevent duplicate active offers for the same buyer + lot
    const existingActiveOffer = await Offer.findOne({
      $or: [
        { lotId: lot._id },
        { lotId: String(lot._id) },
        { lotId: lot.lotId },
      ],
      $and: [
        {
          $or: [
            { buyerId: String(buyerId) },
            { buyerId: rawUserId },
            ...(buyerEmail ? [{ buyerId: buyerEmail }] : [])
          ]
        }
      ],
      offerStatus: { $in: ['PENDING', 'COUNTERED'] },
    });

    if (existingActiveOffer) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ACTIVE_OFFER_EXISTS',
          message: `An active binding offer (${existingActiveOffer.offerId}) already exists for this lot.`,
          offerId: existingActiveOffer.offerId,
        },
        data: existingActiveOffer,
      });
    }

    const grossValue = Math.round(pPerQtl * qty);
    const estimatedTransportCost = Math.round(35 * 1.35 * qty);
    const estimatedMarketHandlingCharges = Math.round(grossValue * 0.005);
    const estimatedSpoilage = Math.round(grossValue * 0.015);
    const estimatedNetRealization = grossValue - estimatedTransportCost - estimatedMarketHandlingCharges - estimatedSpoilage;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const offerId = await generateOfferId();

    const offer = await Offer.create({
      offerId,
      lotId: lot._id as any,
      buyerId,
      sellerUserId: lot.userId,
      commodity: lot.cropName,
      variety: lot.variety || 'Standard',
      grade: lot.grade || 'Grade A',
      quantityQtl: qty,
      pricePerQtl: pPerQtl,
      grossValue,
      estimatedTransportCost,
      estimatedLabourCost: 0,
      estimatedSpoilage,
      estimatedMarketHandlingCharges,
      estimatedNetRealization,
      paymentTerms: paymentTerms || 'T+1 Direct Bank Transfer (Simulated Escrow)',
      deliveryTerms: deliveryTerms || 'Buyer Pickup',
      pickupLocation: lot.origin || 'Farm Gate',
      deliveryLocation: 'Buyer Hub / APMC Logistics Yard',
      expiresAt: expiryDate,
      offerStatus: 'PENDING',
      isDemo: false,
    });

    // Send real-time notification to the Farmer
    await sendSystemNotification({
      userId: lot.userId,
      type: 'OFFER_RECEIVED',
      title: 'New Buyer Bid Received',
      message: `Buyer submitted an offer of ₹${pPerQtl}/Qtl for ${lot.cropName} (${qty} Qtl).`,
      relatedCrop: lot.cropName,
      relatedLotId: lot.lotId,
      relatedOfferId: offer._id,
    });

    res.status(201).json({
      success: true,
      message: 'Offer submitted successfully to farmer',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const getOffersForLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let userEmail = (req as any).user?.email;
    if (!userEmail && mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u && u.email) userEmail = u.email;
    }
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { lotId } = req.params;

    const lot = await resolveLot(lotId);

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Trade lot not found' },
      });
    }

    // Verify lot access: farmer who owns the lot or authenticated buyer
    const isSeller =
      String(lot.userId) === String(rawUserId) ||
      String(lot.userId) === String(userIdObj) ||
      (userEmail && String(lot.userId) === String(userEmail));

    const userRole = (req as any).user?.role;
    if (!isSeller && userRole !== 'buyer') {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED_LOT_ACCESS', message: 'You do not own this trade lot.' },
      });
    }

    const offers = await Offer.find({
      $or: [
        { lotId: lot._id },
        { lotId: String(lot._id) },
        { lotId: lot.lotId },
      ],
      offerStatus: {
        $in: ['PENDING', 'COUNTERED', 'ACCEPTED'],
      },
    }).sort({ estimatedNetRealization: -1 });

    const buyerIds = [...new Set(offers.map(o => o.buyerId))];
    const buyers = await Buyer.find({ buyerId: { $in: buyerIds } });
    const buyersMap = new Map(buyers.map(b => [b.buyerId, b]));

    const validUserIds = buyerIds.filter(id => mongoose.isValidObjectId(id));
    const userBuyers = await User.find({
      $or: [
        { _id: { $in: validUserIds } },
        { email: { $in: buyerIds } }
      ]
    });
    const userBuyersMap = new Map(userBuyers.map(u => [String(u._id), u]));
    const userEmailMap = new Map(userBuyers.map(u => [u.email, u]));

    const enrichedOffers = offers.map(o => {
      const buyer = buyersMap.get(o.buyerId);
      const userBuyer = userBuyersMap.get(o.buyerId) || userEmailMap.get(o.buyerId);
      return {
        ...o.toObject(),
        buyer: buyer ? {
          businessName: buyer.businessName,
          buyerType: buyer.buyerType,
          district: buyer.district,
          location: buyer.location,
          isDemo: buyer.isDemo,
          verificationStatus: buyer.verificationStatus,
        } : userBuyer ? {
          businessName: userBuyer.name || `Buyer (${userBuyer.email.split('@')[0]})`,
          buyerType: 'Commercial Buyer',
          district: userBuyer.district || 'Maharashtra',
          location: userBuyer.village || 'Hub',
          isDemo: false,
          verificationStatus: 'VERIFIED',
        } : {
          businessName: o.buyerId.includes('@') ? `Buyer (${o.buyerId.split('@')[0]})` : `Buyer ${o.buyerId.slice(-4)}`,
          buyerType: 'Commercial Buyer',
          district: 'Maharashtra',
          location: 'Hub',
          isDemo: false,
          verificationStatus: 'VERIFIED',
        },
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
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let userEmail = (req as any).user?.email;
    let userRole = (req as any).user?.role;

    if (mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u) {
        if (!userEmail && u.email) userEmail = u.email;
        if (!userRole && u.role) userRole = u.role;
      }
    }

    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { offerId: id },
      ],
      $and: [
        {
          $or: [
            { sellerUserId: rawUserId },
            { sellerUserId: userIdObj },
            { sellerUserId: String(rawUserId) },
            { buyerId: rawUserId },
            { buyerId: userIdObj },
            { buyerId: String(rawUserId) },
            ...(userEmail ? [{ buyerId: userEmail }, { sellerUserId: userEmail }] : []),
          ],
        },
      ],
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

    const isSeller = String(offer.sellerUserId) === String(rawUserId) ||
                     (userEmail && String(offer.sellerUserId) === String(userEmail)) ||
                     (userRole === 'farmer' && String(offer.sellerUserId) === String(rawUserId));

    if (offer.offerStatus === 'COUNTERED') {
      if (offer.counterBy === 'FARMER' && isSeller) {
        return res.status(400).json({
          success: false,
          error: { code: 'CANNOT_ACCEPT_OWN_COUNTER', message: 'You have submitted a counter offer and must wait for the buyer response.' },
        });
      }
      if (offer.counterBy === 'BUYER' && !isSeller) {
        return res.status(400).json({
          success: false,
          error: { code: 'CANNOT_ACCEPT_OWN_COUNTER', message: 'You have submitted a counter offer and must wait for the farmer response.' },
        });
      }
    }

    const lot = await resolveLot(offer.lotId);

    if (!lot) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOT_NOT_FOUND', message: 'Associated trade lot not found.' },
      });
    }

    if (lot.lotStatus === 'ACCEPTED' || lot.lotStatus === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: { code: 'LOT_ALREADY_TRADED', message: 'An offer has already been accepted for this trade lot.' },
      });
    }

    const finalPrice = Number(offer.counterPricePerQtl ?? offer.pricePerQtl);

    offer.pricePerQtl = finalPrice;
    offer.grossValue = Math.round(finalPrice * Number(offer.quantityQtl || 0));
    offer.offerStatus = 'ACCEPTED';
    await offer.save();

    // Reject other pending/countered offers for this lot
    await Offer.updateMany(
      {
        $or: [
          { lotId: lot._id },
          { lotId: String(lot._id) },
          { lotId: lot.lotId },
        ],
        _id: { $ne: offer._id },
        offerStatus: { $in: ['PENDING', 'COUNTERED'] },
      },
      { $set: { offerStatus: 'REJECTED' } }
    );

    lot.lotStatus = 'ACCEPTED';
    await lot.save();

    const estimatedTransportCost = Number(offer.estimatedTransportCost || 0);
    const estimatedLabourCost = Number(offer.estimatedLabourCost || 0);
    const estimatedSpoilage = Number(offer.estimatedSpoilage || 0);
    const estimatedMarketHandlingCharges = Number(offer.estimatedMarketHandlingCharges || 0);
    const totalDeductions = estimatedTransportCost + estimatedLabourCost + estimatedSpoilage + estimatedMarketHandlingCharges;
    const finalNetAmount = Number(offer.grossValue || 0) - totalDeductions;

    const countTxn = await Transaction.countDocuments();
    const txnHex = (countTxn + 301).toString(16).toUpperCase().padStart(4, '0');
    const transactionId = `TXN-2026-${txnHex}`;

    const transaction = await Transaction.create({
      transactionId,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: offer.sellerUserId as any,
      buyerId: offer.buyerId,
      crop: offer.commodity,
      variety: offer.variety,
      grade: offer.grade,
      quantityQtl: offer.quantityQtl,
      agreedPricePerQtl: finalPrice,
      grossAmount: offer.grossValue,
      totalDeductions,
      finalNetAmount,
      transactionStatus: 'OFFER_ACCEPTED',
      isDemo: false,
    });

    const countDlv = await DeliveryOrder.countDocuments();
    const dlvHex = (countDlv + 401).toString(16).toUpperCase().padStart(4, '0');
    const deliveryId = `DLV-2026-${dlvHex}`;

    const pickupDate = new Date();
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 1);

    const delivery = await DeliveryOrder.create({
      deliveryId,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: offer.sellerUserId as any,
      buyerId: offer.buyerId,
      crop: offer.commodity,
      variety: offer.variety,
      grade: offer.grade,
      quantityQtl: offer.quantityQtl,
      agreedPricePerQtl: finalPrice,
      vehicleType: 'Medium Pickup (Bolero MaxiTruck)',
      freightRate: '₹1.35/km/Qtl',
      estimatedFreight: offer.estimatedTransportCost || 0,
      origin: offer.pickupLocation || lot.origin || 'Farm Gate',
      destination: offer.deliveryLocation || 'Mandi Yard Hub',
      plannedPickupDate: pickupDate,
      expectedDeliveryDate,
      deliveryStatus: 'OFFER_ACCEPTED_PLANNED',
      timeline: [
        {
          status: 'OFFER_ACCEPTED_PLANNED',
          label: 'Offer Accepted & Planned',
          timestamp: new Date().toISOString(),
        },
      ],
      notes: `Deal confirmed for ${offer.commodity} • Lot ${lot.lotId}`,
      isDemo: false,
    });

    const countPmt = await PaymentLedger.countDocuments();
    const pmtHex = (countPmt + 501).toString(16).toUpperCase().padStart(4, '0');
    const paymentId = `PMT-2026-${pmtHex}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    const payment = await PaymentLedger.create({
      paymentId,
      transactionId: transaction._id as any,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: offer.sellerUserId as any,
      buyerId: offer.buyerId,
      grossAmount: transaction.grossAmount,
      deductions: transaction.totalDeductions,
      netPayable: transaction.finalNetAmount,
      paymentMode: 'DEMO_BANK_TRANSFER',
      dueDate,
      paymentStatus: 'PENDING',
      referenceId: `REF-ESCROW-${pmtHex}`,
      notes: `Escrow payment initialized for ${offer.commodity} • Deal ${deliveryId}`,
      isDemo: false,
    });

    if (!isSeller) {
      await sendSystemNotification({
        userId: offer.sellerUserId,
        type: 'OFFER_ACCEPTED',
        title: 'Deal Confirmed! Buyer Accepted Counter Offer',
        message: `Buyer has accepted your counter offer at ₹${finalPrice}/Qtl.`,
        relatedCrop: offer.commodity,
        relatedLotId: lot.lotId,
        relatedOfferId: offer._id,
        counterPrice: finalPrice,
      });

      await sendSystemNotification({
        userId: offer.buyerId,
        type: 'OFFER_ACCEPTED',
        title: 'Purchase Confirmed! Delivery Initiated',
        message: `Purchase for ${offer.commodity} (${offer.quantityQtl} Qtl at ₹${finalPrice}/Qtl) confirmed. Escrow secured.`,
        relatedCrop: offer.commodity,
        relatedLotId: lot.lotId,
        relatedOfferId: offer._id,
        counterPrice: finalPrice,
      });
    } else {
      await sendSystemNotification({
        userId: offer.sellerUserId,
        type: 'OFFER_ACCEPTED',
        title: 'Deal Confirmed! Offer Accepted',
        message: `Your deal for ${offer.commodity} (${offer.quantityQtl} Qtl at ₹${finalPrice}/Qtl) is confirmed. Delivery tracking ${deliveryId} initiated.`,
        relatedCrop: offer.commodity,
        relatedLotId: lot.lotId,
        relatedOfferId: offer._id,
        counterPrice: finalPrice,
      });

      await sendSystemNotification({
        userId: offer.buyerId,
        type: 'OFFER_ACCEPTED',
        title: 'Purchase Confirmed! Farmer Accepted Offer',
        message: `Farmer accepted your offer for ${offer.commodity} (${offer.quantityQtl} Qtl at ₹${finalPrice}/Qtl).`,
        relatedCrop: offer.commodity,
        relatedLotId: lot.lotId,
        relatedOfferId: offer._id,
        counterPrice: finalPrice,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer accepted successfully. Trade execution, delivery order, and payment ledger initiated.',
      data: {
        offer,
        lot,
        transaction,
        delivery,
        payment,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const rejectOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let userEmail = (req as any).user?.email;
    let userRole = (req as any).user?.role;
    if (mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u) {
        if (!userEmail && u.email) userEmail = u.email;
        if (!userRole && u.role) userRole = u.role;
      }
    }
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      $and: [{
        $or: [
          { sellerUserId: rawUserId },
          { sellerUserId: userIdObj },
          { sellerUserId: String(rawUserId) },
          { buyerId: rawUserId },
          { buyerId: String(rawUserId) },
          ...(userEmail ? [{ buyerId: userEmail }, { sellerUserId: userEmail }] : []),
        ]
      }],
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

    const isSeller = String(offer.sellerUserId) === String(rawUserId) ||
                     (userEmail && String(offer.sellerUserId) === userEmail) ||
                     (userRole === 'farmer' && String(offer.sellerUserId) === String(rawUserId));

    const lot = await resolveLot(offer.lotId);
    const relatedLotId = lot ? lot.lotId : offer.lotId;

    if (!isSeller) {
      await sendSystemNotification({
        userId: offer.sellerUserId,
        type: 'OFFER_REJECTED',
        title: 'Offer Declined',
        message: `Buyer rejected your counter offer.`,
        relatedCrop: offer.commodity,
        relatedLotId,
        relatedOfferId: offer._id,
      });
    } else {
      await sendSystemNotification({
        userId: offer.buyerId,
        type: 'OFFER_REJECTED',
        title: 'Offer Declined',
        message: `Farmer declined your offer for ${offer.commodity}.`,
        relatedCrop: offer.commodity,
        relatedLotId,
        relatedOfferId: offer._id,
      });
    }

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
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    let userEmail = (req as any).user?.email;
    let userRole = (req as any).user?.role;
    if (mongoose.isValidObjectId(rawUserId)) {
      const u = await User.findById(rawUserId);
      if (u) {
        if (!userEmail && u.email) userEmail = u.email;
        if (!userRole && u.role) userRole = u.role;
      }
    }
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;
    const { counterPricePerQtl, counterQuantityQtl, message } = req.body;

    if (!counterPricePerQtl || isNaN(Number(counterPricePerQtl))) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COUNTER_PRICE', message: 'Valid counter price per Qtl is required.' }
      });
    }

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      $and: [{
        $or: [
          { sellerUserId: rawUserId },
          { sellerUserId: userIdObj },
          { sellerUserId: String(rawUserId) },
          { buyerId: rawUserId },
          { buyerId: String(rawUserId) },
          ...(userEmail ? [{ buyerId: userEmail }, { sellerUserId: userEmail }] : []),
        ]
      }],
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
        error: { code: 'INVALID_OFFER_STATE', message: `Cannot counter offer with status ${offer.offerStatus}.` },
      });
    }

    const isSeller = String(offer.sellerUserId) === String(rawUserId) ||
                     (userEmail && String(offer.sellerUserId) === userEmail) ||
                     (userRole === 'farmer' && String(offer.sellerUserId) === String(rawUserId));

    const counterPriceNum = Number(counterPricePerQtl);
    const lot = await resolveLot(offer.lotId);
    const relatedLotId = lot ? lot.lotId : offer.lotId;

    if (isSeller) {
      if (offer.offerStatus === 'COUNTERED' && offer.counterBy === 'FARMER') {
        return res.status(400).json({
          success: false,
          error: { code: 'AWAITING_BUYER', message: 'You have already submitted a counter offer. Please wait for the buyer response.' }
        });
      }

      offer.offerStatus = 'COUNTERED';
      offer.counterBy = 'FARMER';
      offer.counterPricePerQtl = counterPriceNum;
      if (counterQuantityQtl) offer.counterQuantityQtl = Number(counterQuantityQtl);
      if (message) offer.counterMessage = message;
      await offer.save();

      await sendSystemNotification({
        userId: offer.buyerId,
        type: 'COUNTER_OFFER',
        title: 'Farmer Counter Offer Received',
        message: `Farmer has countered your offer for ${offer.commodity} at ₹${counterPriceNum}/Qtl.`,
        relatedCrop: offer.commodity,
        relatedLotId,
        relatedOfferId: offer._id,
        counterPrice: counterPriceNum,
      });
    } else {
      if (offer.offerStatus === 'COUNTERED' && offer.counterBy === 'BUYER') {
        return res.status(400).json({
          success: false,
          error: { code: 'AWAITING_FARMER', message: 'You have already submitted a counter offer. Please wait for the farmer response.' }
        });
      }

      offer.offerStatus = 'COUNTERED';
      offer.counterBy = 'BUYER';
      offer.counterPricePerQtl = counterPriceNum;
      if (counterQuantityQtl) offer.counterQuantityQtl = Number(counterQuantityQtl);
      if (message) offer.counterMessage = message;
      await offer.save();

      await sendSystemNotification({
        userId: offer.sellerUserId,
        type: 'COUNTER_OFFER',
        title: 'Buyer Counter Offer Received',
        message: `Buyer has countered your offer at ₹${counterPriceNum}/Qtl.`,
        relatedCrop: offer.commodity,
        relatedLotId,
        relatedOfferId: offer._id,
        counterPrice: counterPriceNum,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Counter offer submitted successfully',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userEmail = (req as any).user?.email;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const offer = await Offer.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { offerId: id }],
      $and: [{
        $or: [
          { sellerUserId: rawUserId },
          { sellerUserId: userIdObj },
          { sellerUserId: String(rawUserId) },
          { buyerId: rawUserId },
          { buyerId: String(rawUserId) },
          { buyerId: userEmail },
        ]
      }],
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