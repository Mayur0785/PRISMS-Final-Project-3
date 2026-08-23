import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../users/user.model';
import { Lot } from '../lots/lot.model';
import { Offer } from './offer.model';
import { Buyer } from '../buyers/buyer.model';

export async function seedDemoTradeLotsAndOffers() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Kisan@2024', salt);

    // 1. Ensure Demo Farmer exists
    let farmer = await User.findOne({ email: 'farmer.lasalgaon@prisms.gov.in' });
    if (!farmer) {
      farmer = await User.create({
        email: 'farmer.lasalgaon@prisms.gov.in',
        passwordHash,
        name: 'Mayur Kapse (Lasalgaon)',
        role: 'farmer',
        village: 'Lasalgaon',
        district: 'Nashik',
      });
    }

    // 2. Ensure Demo Buyer exists
    let buyer = await User.findOne({ email: 'buyer.nashik@prisms.gov.in' });
    if (!buyer) {
      buyer = await User.create({
        email: 'buyer.nashik@prisms.gov.in',
        passwordHash,
        name: 'Nashik Agro Processors Ltd.',
        role: 'buyer',
        village: 'MIDC Ambad',
        district: 'Nashik',
      });
    }

    const farmerId = farmer._id;
    const buyerId = String(buyer._id);

    // 3. Ensure 3 distinct Real Farmer Lots exist across different crops
    const existingLotsCount = await Lot.countDocuments({
      $or: [{ userId: farmerId }, { userId: String(farmerId) }]
    });

    if (existingLotsCount < 3) {
      // Create LOT A: Red Onion (Nashik)
      const lotOnion = await Lot.findOneAndUpdate(
        { lotId: 'LOT-2026-ON01' },
        {
          lotId: 'LOT-2026-ON01',
          userId: farmerId,
          cropName: 'Red Onion',
          variety: 'Garwa',
          grade: 'Grade A',
          provisionalGrade: 'Grade A',
          quantityQtl: 50,
          expectedPricePerQtl: 3000,
          minimumAcceptablePrice: 2700,
          qualityScore: 92,
          evidenceConfidence: 82,
          qualityPassport: {
            crop: 'Red Onion',
            provisionalGrade: 'Grade A',
            qualityScore: 92,
            evidenceConfidence: 82,
            parametersList: [
              { name: 'Predominant Bulb Size', value: 'Large (> 60mm)', unit: 'Category', score: 100 },
              { name: 'Bulb Size Uniformity', value: 'Uniform', unit: 'Category', score: 100 },
              { name: 'Rot / Disease', value: 1.5, unit: '%', score: 95 },
              { name: 'Sprouting', value: 0.5, unit: '%', score: 100 },
              { name: 'Neck Drying (Curing)', value: 'Well Dried', unit: 'Condition', score: 100 },
              { name: 'Bulb Firmness', value: 'Firm & Solid', unit: 'Texture', score: 100 },
            ],
            verificationStatus: 'Provisional — Farmer Submitted Assessment',
            disclaimer: 'Assessment is provisional and based on farmer-submitted measurements.',
          },
          origin: 'Farm Gate, Niphad',
          district: 'Nashik',
          buyerVisibility: 'PUBLIC',
          lotStatus: 'PUBLISHED',
        },
        { upsert: true, new: true }
      );

      // Create LOT B: Sharbati Wheat (Pune / Lasalgaon)
      const lotWheat = await Lot.findOneAndUpdate(
        { lotId: 'LOT-2026-WH02' },
        {
          lotId: 'LOT-2026-WH02',
          userId: farmerId,
          cropName: 'Wheat',
          variety: 'Sharbati',
          grade: 'Grade A',
          provisionalGrade: 'Grade A',
          quantityQtl: 60,
          expectedPricePerQtl: 2750,
          minimumAcceptablePrice: 2500,
          qualityScore: 95,
          evidenceConfidence: 85,
          qualityPassport: {
            crop: 'Wheat',
            provisionalGrade: 'Grade A',
            qualityScore: 95,
            evidenceConfidence: 85,
            parametersList: [
              { name: 'Moisture Content', value: 10.5, unit: '%', score: 100 },
              { name: 'Foreign Matter', value: 0.8, unit: '%', score: 100 },
              { name: 'Damaged / Discoloured', value: 1.0, unit: '%', score: 95 },
              { name: 'Weevil Damaged Grains', value: 0, unit: '%', score: 100 },
              { name: 'Grain Lustre & Colour', value: 'Bold Amber Lustrous', unit: 'Category', score: 100 },
            ],
            verificationStatus: 'Provisional — Farmer Submitted Assessment',
            disclaimer: 'Assessment is provisional and based on farmer-submitted measurements.',
          },
          origin: 'APMC Yard, Lasalgaon',
          district: 'Nashik',
          buyerVisibility: 'PUBLIC',
          lotStatus: 'PUBLISHED',
        },
        { upsert: true, new: true }
      );

      // Create LOT C: Hybrid Tomato (Nashik)
      const lotTomato = await Lot.findOneAndUpdate(
        { lotId: 'LOT-2026-TM03' },
        {
          lotId: 'LOT-2026-TM03',
          userId: farmerId,
          cropName: 'Tomato',
          variety: 'Abhinav',
          grade: 'Grade A',
          provisionalGrade: 'Grade A',
          quantityQtl: 40,
          expectedPricePerQtl: 2800,
          minimumAcceptablePrice: 2500,
          qualityScore: 90,
          evidenceConfidence: 80,
          qualityPassport: {
            crop: 'Tomato',
            provisionalGrade: 'Grade A',
            qualityScore: 90,
            evidenceConfidence: 80,
            parametersList: [
              { name: 'Ripeness & Colour Stage', value: 'Breaker / Turning (10-30% pink)', unit: 'Stage', score: 100 },
              { name: 'Fruit Firmness', value: 'Very Firm', unit: 'Texture', score: 100 },
              { name: 'Cracking / Bruising', value: 2.0, unit: '%', score: 90 },
              { name: 'Pest Spots / Blight', value: 0.5, unit: '%', score: 95 },
            ],
            verificationStatus: 'Provisional — Farmer Submitted Assessment',
            disclaimer: 'Assessment is provisional and based on farmer-submitted measurements.',
          },
          origin: 'Farm Gate, Pimpalgaon',
          district: 'Nashik',
          buyerVisibility: 'PUBLIC',
          lotStatus: 'PUBLISHED',
        },
        { upsert: true, new: true }
      );

      // 4. Create 3 Real MongoDB Offers for these lots
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);

      // Offer 1: Red Onion (₹3100/Qtl, Buyer: Nashik Agro Processors Ltd.)
      const qty1 = lotOnion.quantityQtl;
      const price1 = 3100;
      const gross1 = qty1 * price1;
      const freight1 = Math.round(25 * 1.35 * qty1);
      const handling1 = Math.round(gross1 * 0.005);
      const spoilage1 = Math.round(gross1 * 0.015);
      const net1 = gross1 - freight1 - handling1 - spoilage1;

      await Offer.findOneAndUpdate(
        { offerId: 'OFR-2026-0101' },
        {
          offerId: 'OFR-2026-0101',
          lotId: lotOnion._id,
          buyerId,
          sellerUserId: farmerId,
          commodity: 'Red Onion',
          variety: 'Garwa',
          grade: 'Grade A',
          quantityQtl: qty1,
          pricePerQtl: price1,
          grossValue: gross1,
          estimatedTransportCost: freight1,
          estimatedLabourCost: 0,
          estimatedSpoilage: spoilage1,
          estimatedMarketHandlingCharges: handling1,
          estimatedNetRealization: net1,
          paymentTerms: 'T+1 Escrow Direct Bank Transfer',
          deliveryTerms: 'Buyer Pickup from Farm Gate',
          pickupLocation: lotOnion.origin,
          deliveryLocation: 'Nashik Agro Processing Hub, Ambad MIDC',
          expiresAt: expiryDate,
          offerStatus: 'PENDING',
          isDemo: false,
        },
        { upsert: true }
      );

      // Offer 2: Wheat (₹2700/Qtl, Buyer: ABC Agro Foods / Nashik Agro Processors)
      const qty2 = lotWheat.quantityQtl;
      const price2 = 2700;
      const gross2 = qty2 * price2;
      const freight2 = Math.round(30 * 1.35 * qty2);
      const handling2 = Math.round(gross2 * 0.005);
      const spoilage2 = Math.round(gross2 * 0.015);
      const net2 = gross2 - freight2 - handling2 - spoilage2;

      await Offer.findOneAndUpdate(
        { offerId: 'OFR-2026-0102' },
        {
          offerId: 'OFR-2026-0102',
          lotId: lotWheat._id,
          buyerId,
          sellerUserId: farmerId,
          commodity: 'Wheat',
          variety: 'Sharbati',
          grade: 'Grade A',
          quantityQtl: qty2,
          pricePerQtl: price2,
          grossValue: gross2,
          estimatedTransportCost: freight2,
          estimatedLabourCost: 0,
          estimatedSpoilage: spoilage2,
          estimatedMarketHandlingCharges: handling2,
          estimatedNetRealization: net2,
          paymentTerms: 'T+1 Escrow Direct Bank Transfer',
          deliveryTerms: 'Buyer Pickup',
          pickupLocation: lotWheat.origin,
          deliveryLocation: 'ABC Agro Milling Hub, Lasalgaon',
          expiresAt: expiryDate,
          offerStatus: 'PENDING',
          isDemo: false,
        },
        { upsert: true }
      );

      // Offer 3: Tomato (₹2800/Qtl, Buyer: Fresh Foods Ltd. / Nashik Agro Processors)
      const qty3 = lotTomato.quantityQtl;
      const price3 = 2800;
      const gross3 = qty3 * price3;
      const freight3 = Math.round(20 * 1.35 * qty3);
      const handling3 = Math.round(gross3 * 0.005);
      const spoilage3 = Math.round(gross3 * 0.015);
      const net3 = gross3 - freight3 - handling3 - spoilage3;

      await Offer.findOneAndUpdate(
        { offerId: 'OFR-2026-0103' },
        {
          offerId: 'OFR-2026-0103',
          lotId: lotTomato._id,
          buyerId,
          sellerUserId: farmerId,
          commodity: 'Tomato',
          variety: 'Abhinav',
          grade: 'Grade A',
          quantityQtl: qty3,
          pricePerQtl: price3,
          grossValue: gross3,
          estimatedTransportCost: freight3,
          estimatedLabourCost: 0,
          estimatedSpoilage: spoilage3,
          estimatedMarketHandlingCharges: handling3,
          estimatedNetRealization: net3,
          paymentTerms: 'Immediate UPI on Pickup Verification',
          deliveryTerms: 'Buyer Pickup',
          pickupLocation: lotTomato.origin,
          deliveryLocation: 'Fresh Foods Cold Storage, Pimpalgaon',
          expiresAt: expiryDate,
          offerStatus: 'PENDING',
          isDemo: false,
        },
        { upsert: true }
      );

      console.log('✅ PRISMS Real Farmer Trade Lots & Multi-Crop Buyer Offers Seeded Successfully!');
    }
  } catch (err) {
    console.error('❌ Error seeding demo trade lots & offers:', err);
  }
}
