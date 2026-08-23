import { Request, Response, NextFunction } from 'express';
import { Transaction } from './transaction.model';
import { Lot } from '../lots/lot.model';
import { Offer } from '../offers/offer.model';
import { DeliveryOrder } from '../delivery/delivery.model';
import { PaymentLedger } from '../payments/payment.model';
import { Buyer } from '../buyers/buyer.model';
import mongoose from 'mongoose';

export const getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { crop, status } = req.query;

    const query: any = {
      $or: [
        { farmerId: rawUserId },
        { farmerId: userIdObj },
        { farmerId: String(rawUserId) }
      ]
    };
    if (crop) {
      query.crop = new RegExp(crop as string, 'i');
    }
    if (status) {
      query.transactionStatus = status;
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    const buyerIds = [...new Set(transactions.map(t => t.buyerId))];
    const buyers = await Buyer.find({ buyerId: { $in: buyerIds } });
    const buyersMap = new Map(buyers.map(b => [b.buyerId, b]));

    const enriched = transactions.map(t => {
      const buyer = buyersMap.get(t.buyerId);
      return {
        ...t.toObject(),
        buyer: buyer ? {
          businessName: buyer.businessName,
          buyerType: buyer.buyerType,
          district: buyer.district,
          location: buyer.location,
        } : null,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { transactionId: id }],
      $and: [{
        $or: [
          { farmerId: rawUserId },
          { farmerId: userIdObj },
          { farmerId: String(rawUserId) }
        ]
      }],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction record not found or unauthorized' },
      });
    }

    const [lot, offer, delivery, payment, buyer] = await Promise.all([
      Lot.findById(transaction.lotId),
      Offer.findById(transaction.offerId),
      transaction.deliveryId ? DeliveryOrder.findById(transaction.deliveryId) : null,
      transaction.paymentId ? PaymentLedger.findById(transaction.paymentId) : null,
      Buyer.findOne({ buyerId: transaction.buyerId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transaction,
        lot,
        offer,
        delivery,
        payment,
        buyer,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { transactionId: id }],
      $and: [{
        $or: [
          { farmerId: rawUserId },
          { farmerId: userIdObj },
          { farmerId: String(rawUserId) }
        ]
      }],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction record not found or unauthorized' },
      });
    }

    const [offer, delivery, payment, buyer] = await Promise.all([
      Offer.findById(transaction.offerId),
      transaction.deliveryId ? DeliveryOrder.findById(transaction.deliveryId) : null,
      transaction.paymentId ? PaymentLedger.findById(transaction.paymentId) : null,
      Buyer.findOne({ buyerId: transaction.buyerId }),
    ]);

    const summaryDocument = {
      title: 'PRISMS DEMO / SIMULATED TRANSACTION SUMMARY',
      documentType: 'Simulated Trade Realization Record (PS 26132 Sandbox)',
      transactionId: transaction.transactionId,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      status: transaction.transactionStatus,
      isDemo: true,
      tradeDetails: {
        commodity: transaction.crop,
        variety: transaction.variety,
        grade: transaction.grade,
        quantityQtl: transaction.quantityQtl,
        agreedPricePerQtl: transaction.agreedPricePerQtl,
        grossSaleValue: transaction.grossAmount,
      },
      deductionsBreakdown: {
        transportCost: offer?.estimatedTransportCost || 0,
        labourCost: offer?.estimatedLabourCost || 0,
        spoilageCost: offer?.estimatedSpoilage || 0,
        marketHandlingFee: offer?.estimatedMarketHandlingCharges || 0,
        totalDeductions: transaction.totalDeductions,
      },
      netRealization: transaction.finalNetAmount,
      buyer: {
        buyerId: buyer?.buyerId || transaction.buyerId,
        businessName: buyer?.businessName || 'Demo Commercial Buyer',
        buyerType: buyer?.buyerType || 'Processor',
        district: buyer?.district || 'Nashik',
      },
      logistics: delivery ? {
        deliveryId: delivery.deliveryId,
        vehicleType: delivery.vehicleType,
        deliveryStatus: delivery.deliveryStatus,
        origin: delivery.origin,
        destination: delivery.destination,
      } : null,
      payment: payment ? {
        paymentId: payment.paymentId,
        paymentMode: payment.paymentMode,
        paymentStatus: payment.paymentStatus,
        referenceId: payment.referenceId,
        paidDate: payment.paidDate,
      } : null,
    };

    res.status(200).json({
      success: true,
      data: summaryDocument,
    });
  } catch (err) {
    next(err);
  }
};
