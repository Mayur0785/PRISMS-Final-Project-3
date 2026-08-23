import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryStatus = 'PLANNED' | 'PICKUP_READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';

export interface IDeliveryOrder extends Document {
  deliveryId: string;
  lotId: Schema.Types.ObjectId;
  offerId: Schema.Types.ObjectId;
  farmerId: Schema.Types.ObjectId;
  buyerId: string;
  vehicleType: string;
  quantityQtl: number;
  origin: string;
  destination: string;
  plannedPickupDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  deliveryStatus: DeliveryStatus;
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
    vehicleType: { type: String, default: 'Medium Pickup (Bolero MaxiTruck)' },
    quantityQtl: { type: Number, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    plannedPickupDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date, required: true },
    actualDeliveryDate: { type: Date },
    deliveryStatus: {
      type: String,
      enum: ['PLANNED', 'PICKUP_READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'],
      default: 'PLANNED',
      index: true,
    },
    notes: { type: String, default: 'Simulated Logistics Tracking Order' },
    isDemo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DeliveryOrder = mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);
