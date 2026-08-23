import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'DISPUTED' | 'CANCELLED';
export type PaymentMode = 'DEMO_BANK_TRANSFER' | 'DEMO_UPI' | 'DEMO_CASH';

export interface IPaymentLedger extends Document {
  paymentId: string;
  transactionId: Schema.Types.ObjectId;
  lotId: Schema.Types.ObjectId;
  offerId: Schema.Types.ObjectId;
  farmerId: Schema.Types.ObjectId;
  buyerId: string;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  paymentMode: PaymentMode;
  dueDate: Date;
  paidDate?: Date;
  paymentStatus: PaymentStatus;
  referenceId: string; // DEMO-TXN-XXXX
  notes?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLedgerSchema = new Schema<IPaymentLedger>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: Schema.Types.Mixed, required: true, index: true },
    lotId: { type: Schema.Types.Mixed, required: true },
    offerId: { type: Schema.Types.Mixed, required: true },
    farmerId: { type: Schema.Types.Mixed, required: true, index: true },
    buyerId: { type: String, required: true },
    grossAmount: { type: Number, required: true },
    deductions: { type: Number, required: true, default: 0 },
    netPayable: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ['DEMO_BANK_TRANSFER', 'DEMO_UPI', 'DEMO_CASH'],
      default: 'DEMO_BANK_TRANSFER',
    },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    referenceId: { type: String, required: true },
    notes: { type: String, default: 'Simulated Sandbox Payment Record' },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PaymentLedger = mongoose.model<IPaymentLedger>('PaymentLedger', PaymentLedgerSchema);
