import { Request, Response, NextFunction } from 'express';
import { DeliveryOrder, DeliveryStatus } from './delivery.model';
import { Transaction } from '../transactions/transaction.model';
import { PaymentLedger } from '../payments/payment.model';
import { Lot } from '../lots/lot.model';
import { Offer } from '../offers/offer.model';
import mongoose from 'mongoose';

async function generateDeliveryId(): Promise<string> {
  const count = await DeliveryOrder.countDocuments();
  const hex = (count + 401).toString(16).toUpperCase().padStart(4, '0');
  return `DLV-2026-${hex}`;
}

export const getUserDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const deliveries = await DeliveryOrder.find({ farmerId: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (err) {
    next(err);
  }
};

export const createDeliveryOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user?._id || (req as any).user?.id || (req as any).user;
    const userId = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const { offerId, vehicleType, plannedPickupDate, notes } = req.body;

    const offer = await Offer.findOne({
      $and: [
        {
          $or: [
            { _id: mongoose.isValidObjectId(offerId) ? offerId : null },
            { offerId },
            { _id: offerId }
          ]
        },
        {
          $or: [
            { sellerUserId: rawUserId },
            { sellerUserId: userId },
            { sellerUserId: String(rawUserId) }
          ]
        }
      ]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: { code: 'OFFER_NOT_FOUND', message: 'Offer not found or unauthorized' },
      });
    }

    const existingDelivery = await DeliveryOrder.findOne({ offerId: offer._id as any });
    if (existingDelivery) {
      return res.status(200).json({
        success: true,
        data: existingDelivery,
      });
    }

    const count = await DeliveryOrder.countDocuments();
    const hex = (count + 401).toString(16).toUpperCase().padStart(4, '0');
    const deliveryId = `DLV-2026-${hex}`;

    const pickupDate = plannedPickupDate ? new Date(plannedPickupDate) : new Date();
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + 1);

    const delivery: any = await DeliveryOrder.create({
      deliveryId,
      lotId: offer.lotId as any,
      offerId: offer._id as any,
      farmerId: userId as any,
      buyerId: offer.buyerId,
      vehicleType: vehicleType || 'Medium Pickup (Bolero MaxiTruck)',
      quantityQtl: offer.quantityQtl,
      origin: offer.pickupLocation || 'Farm Gate, Nashik',
      destination: offer.deliveryLocation || 'Mandi Terminal',
      plannedPickupDate: pickupDate,
      expectedDeliveryDate: deliveryDate,
      deliveryStatus: 'PLANNED' as any,
      notes,
      isDemo: true,
    });

    // 1. Find or Create Transaction Record
    let transaction: any = await Transaction.findOne({ offerId: offer._id as any });
    if (!transaction) {
      const countTxn = await Transaction.countDocuments();
      const txnHex = (countTxn + 301).toString(16).toUpperCase().padStart(4, '0');
      const transactionId = `TXN-2026-${txnHex}`;

      const totalDeductions = offer.estimatedTransportCost + offer.estimatedLabourCost + offer.estimatedSpoilage + offer.estimatedMarketHandlingCharges;

      transaction = await Transaction.create({
        transactionId,
        lotId: offer.lotId as any,
        offerId: offer._id as any,
        deliveryId: delivery._id as any,
        farmerId: userId as any,
        buyerId: offer.buyerId,
        crop: offer.commodity || 'Red Onion',
        variety: offer.variety || 'Garwa',
        grade: offer.grade || 'Grade A',
        quantityQtl: offer.quantityQtl,
        agreedPricePerQtl: offer.pricePerQtl,
        grossAmount: offer.grossValue,
        totalDeductions: totalDeductions || (offer.grossValue - offer.estimatedNetRealization),
        finalNetAmount: offer.estimatedNetRealization,
        transactionStatus: 'OFFER_ACCEPTED',
        isDemo: true,
      });
    } else {
      transaction.deliveryId = delivery._id as any;
      transaction.transactionStatus = 'IN_DELIVERY';
      await transaction.save();
    }

    // 2. Find or Create Payment Ledger Record (Status: PENDING)
    let payment: any = await PaymentLedger.findOne({ offerId: offer._id as any });
    if (!payment) {
      const countPay = await PaymentLedger.countDocuments();
      const payHex = (countPay + 501).toString(16).toUpperCase().padStart(4, '0');
      const paymentId = `PAY-2026-${payHex}`;
      const refId = `DEMO-TXN-${payHex}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payment = await PaymentLedger.create({
        paymentId,
        transactionId: transaction._id as any,
        lotId: offer.lotId as any,
        offerId: offer._id as any,
        farmerId: userId as any,
        buyerId: offer.buyerId,
        grossAmount: offer.grossValue,
        deductions: offer.grossValue - offer.estimatedNetRealization,
        netPayable: offer.estimatedNetRealization,
        paymentMode: 'DEMO_BANK_TRANSFER',
        dueDate,
        paymentStatus: 'PENDING',
        referenceId: refId,
        isDemo: true,
      });

      transaction.paymentId = payment._id as any;
      await transaction.save();
    }

    res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (err) {
    console.error('Error creating delivery order on backend:', err);
    next(err);
  }
};

const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PLANNED: ['PICKUP_READY', 'DISPATCHED', 'CANCELLED'],
  PICKUP_READY: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export const updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    const { id } = req.params;
    const { status, notes } = req.body;

    const delivery = await DeliveryOrder.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { deliveryId: id }],
      farmerId: userId,
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'DELIVERY_NOT_FOUND', message: 'Delivery order not found or unauthorized' },
      });
    }

    const currentStatus = delivery.deliveryStatus;
    const newStatus = status as DeliveryStatus;

    const allowedNext = VALID_DELIVERY_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition delivery status from ${currentStatus} to ${newStatus}. Allowed next states: ${allowedNext.join(', ') || 'None (Terminal)'}`,
        },
      });
    }

    delivery.deliveryStatus = newStatus;
    if (notes) delivery.notes = notes;
    if (newStatus === 'DELIVERED') {
      delivery.actualDeliveryDate = new Date();
    }
    await delivery.save();

    // If status reached DELIVERED, update Transaction and create PaymentLedger
    if (newStatus === 'DELIVERED') {
      const transaction: any = await Transaction.findOne({ offerId: delivery.offerId as any });
      if (transaction) {
        transaction.transactionStatus = 'DELIVERED';
        await transaction.save();

        // Create PaymentLedger if not exists
        const existingPayment = await PaymentLedger.findOne({ transactionId: transaction._id as any });
        if (!existingPayment) {
          const countPmt = await PaymentLedger.countDocuments();
          const pmtHex = (countPmt + 501).toString(16).toUpperCase().padStart(4, '0');
          const paymentId = `PMT-2026-${pmtHex}`;
          const refHex = (countPmt + 9001).toString(16).toUpperCase();
          const referenceId = `DEMO-TXN-${refHex}`;

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 2);

          const payment = await PaymentLedger.create({
            paymentId,
            transactionId: transaction._id as any,
            lotId: delivery.lotId as any,
            offerId: delivery.offerId as any,
            farmerId: userId as any,
            buyerId: delivery.buyerId,
            grossAmount: transaction.grossAmount,
            deductions: transaction.totalDeductions,
            netPayable: transaction.finalNetAmount,
            paymentMode: 'DEMO_BANK_TRANSFER',
            dueDate,
            paymentStatus: 'PENDING',
            referenceId,
            notes: 'Simulated Escrow Settlement Pending',
            isDemo: true,
          });

          transaction.paymentId = payment._id as any;
          transaction.transactionStatus = 'PAYMENT_PENDING';
          await transaction.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};
