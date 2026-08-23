import mongoose, { Schema, Document } from 'mongoose';

export interface IMarket extends Document {
  name: string;
  state: string;
  district: string;
  commodities: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}

const MarketSchema = new Schema(
  {
    name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    commodities: [{ type: String }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    }
  },
  { timestamps: true }
);

// Crucial for Geospatial queries
MarketSchema.index({ location: '2dsphere' });

export const Market = mongoose.model<IMarket>('Market', MarketSchema);
