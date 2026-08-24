import mongoose from 'mongoose';
import { Lot } from '../lots/lot.model';

/**
 * Safely resolves a Lot from MongoDB whether given a MongoDB ObjectId string/object
 * or a business lotId string (e.g. 'LOT-2026-759C').
 */
export async function resolveLot(identifier: string | any) {
  if (!identifier) return null;
  const strId = String(identifier).trim();
  if (mongoose.isValidObjectId(strId)) {
    const lot = await Lot.findById(strId);
    if (lot) return lot;
  }
  return await Lot.findOne({ lotId: strId });
}
