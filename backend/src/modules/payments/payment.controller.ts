import { Request, Response, NextFunction } from 'express';
import { PaymentLedger, PaymentStatus } from './payment.model';
import { Transaction } from '../transactions/transaction.model';
import { Lot } from '../lots/lot.model';
import mongoose from 'mongoose';

export const getUserPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userEmail = (req as any).user.email;
    const userName = (req as any).user.name;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const orConditions: any[] = [
      { farmerId: rawUserId },
      { farmerId: userIdObj },
      { farmerId: String(rawUserId) },
      { buyerId: rawUserId },
      { buyerId: userIdObj },
      { buyerId: String(rawUserId) },
    ];
    if (userEmail) {
      orConditions.push({ buyerId: userEmail });
      orConditions.push({ farmerId: userEmail });
    }
    if (userName) {
      orConditions.push({ buyerId: userName });
      orConditions.push({ farmerId: userName });
    }

    const payments = await PaymentLedger.find({
      $or: orConditions
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userEmail = (req as any).user.email;
    const userName = (req as any).user.name;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;

    const orConditions: any[] = [
      { farmerId: rawUserId },
      { farmerId: userIdObj },
      { farmerId: String(rawUserId) },
      { buyerId: rawUserId },
      { buyerId: userIdObj },
      { buyerId: String(rawUserId) },
    ];
    if (userEmail) orConditions.push({ buyerId: userEmail });
    if (userName) orConditions.push({ buyerId: userName });

    const payment = await PaymentLedger.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { paymentId: id }],
      $and: [{ $or: orConditions }],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found or unauthorized' },
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PARTIAL', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'],
  PARTIAL: ['PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'],
  PAID: ['DISPUTED'], // Can only be disputed after payment if issue arises
  OVERDUE: ['PAID', 'DISPUTED', 'CANCELLED'],
  DISPUTED: ['PAID', 'CANCELLED'],
  CANCELLED: [],
};

export const updatePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUserId = (req as any).user._id || (req as any).user.id || (req as any).user;
    const userIdObj = (typeof rawUserId === 'string' && mongoose.isValidObjectId(rawUserId))
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;
    const { id } = req.params;
    const { status, notes, paymentMode } = req.body;

    const payment = await PaymentLedger.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { paymentId: id }],
      $and: [{
        $or: [
          { farmerId: rawUserId },
          { farmerId: userIdObj },
          { farmerId: String(rawUserId) }
        ]
      }],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found or unauthorized' },
      });
    }

    const currentStatus = payment.paymentStatus;
    const newStatus = status as PaymentStatus;

    const allowedNext = VALID_PAYMENT_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition payment status from ${currentStatus} to ${newStatus}. Allowed next states: ${allowedNext.join(', ') || 'None'}`,
        },
      });
    }

    payment.paymentStatus = newStatus;
    if (notes) payment.notes = notes;
    if (paymentMode) payment.paymentMode = paymentMode;

    if (newStatus === 'PAID') {
      payment.paidDate = new Date();
    }
    await payment.save();

    // If status is PAID, complete the Transaction and close the Lot
    if (newStatus === 'PAID') {
      const transaction = await Transaction.findById(payment.transactionId);
      if (transaction) {
        transaction.transactionStatus = 'COMPLETED';
        transaction.completedAt = new Date();
        await transaction.save();

        const lot = await Lot.findById(transaction.lotId);
        if (lot) {
          lot.lotStatus = 'CLOSED';
          await lot.save();
        }
      }
    } else if (newStatus === 'DISPUTED') {
      const transaction = await Transaction.findById(payment.transactionId);
      if (transaction) {
        transaction.transactionStatus = 'DISPUTED';
        await transaction.save();
      }
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};
