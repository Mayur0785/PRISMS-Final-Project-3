import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryStatus = 'OFFER_ACCEPTED_PLANNED' | 'PLANNED' | 'PICKUP_READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';

export interface IDeliveryOrder extends Document {
  deliveryId: string;
  lotId: any;
  offerId: any;
  farmerId: any;
  buyerId: string;
  crop?: string;
  variety?: string;
  grade?: string;
  agreedPricePerQtl?: number;
  vehicleType: string;
  freightRate?: string;
  estimatedFreight?: number;
  quantityQtl: number;
  origin: string;
  destination: string;
  plannedPickupDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  deliveryStatus: DeliveryStatus;
  timeline?: any[];
  notes?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    deliveryId: { type: String, required: true, unique: true, index: true },
    lotId: { type: Schema.Types.Mixed, required: true, index: true },
    offerId: { type: Schema.Types.Mixed, required: true },
    farmerId: { type: Schema.Types.Mixed, required: true, index: true },
    buyerId: { type: String, required: true },
    crop: { type: String },
    variety: { type: String },
    grade: { type: String },
    agreedPricePerQtl: { type: Number },
    vehicleType: { type: String, default: 'Medium Pickup (Bolero MaxiTruck)' },
    freightRate: { type: String },
    estimatedFreight: { type: Number },
    quantityQtl: { type: Number, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    plannedPickupDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    deliveryStatus: {
      type: String,
      enum: ['OFFER_ACCEPTED_PLANNED', 'PLANNED', 'PICKUP_READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'],
      default: 'PLANNED',
      index: true,
    },
    timeline: { type: [Schema.Types.Mixed], default: [] },
    notes: { type: String, default: 'Simulated Logistics Tracking Order' },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DeliveryOrder = mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);
