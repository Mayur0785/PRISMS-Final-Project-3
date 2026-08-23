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
        name: 'Mayur Kapse (नवी मुंबई)',
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

    // 3. Ensure Buyer profile exists in Buyer collection
    await Buyer.findOneAndUpdate(
      { buyerId },
      {
        buyerId,
        businessName: 'Nashik Agro Processors Ltd.',
        buyerType: 'Processor',
        location: 'MIDC Ambad, Nashik',
        district: 'Nashik',
        state: 'Maharashtra',
        cropsInterested: ['Onion', 'Red Onion', 'Wheat', 'Tomato', 'Soybeans', 'Yellow Soybeans'],
        preferredGrades: ['Grade A', 'Grade B'],
        minQuantityQtl: 10,
        maxQuantityQtl: 500,
        targetPriceMin: 2000,
        targetPriceMax: 5000,
        deliveryPreference: 'Buyer Pickup from Farm Gate',
        paymentTerms: 'T+1 Escrow Direct Bank Transfer',
        verificationStatus: 'VERIFIED',
        isDemo: false,
        contactPhone: '+91 98220 12345',
        contactEmail: 'buyer.nashik@prisms.gov.in',
      },
      { upsert: true }
    );

    // Also support fallback DEMO-BUYER-01 key
    await Buyer.findOneAndUpdate(
      { buyerId: 'DEMO-BUYER-01' },
      {
        buyerId: 'DEMO-BUYER-01',
        businessName: 'Nashik Agro Processors Ltd.',
        buyerType: 'Processor',
        location: 'Pimpalgaon, Nashik',
        district: 'Nashik',
        state: 'Maharashtra',
        cropsInterested: ['Onion', 'Red Onion', 'Wheat', 'Tomato', 'Soybeans', 'Yellow Soybeans'],
        preferredGrades: ['Grade A', 'Grade B'],
        minQuantityQtl: 10,
        maxQuantityQtl: 500,
        targetPriceMin: 2000,
        targetPriceMax: 5000,
        deliveryPreference: 'Buyer Pickup from Farm Gate',
        paymentTerms: 'T+1 Escrow Direct Bank Transfer',
        verificationStatus: 'VERIFIED',
        isDemo: false,
        contactPhone: '+91 98220 12345',
        contactEmail: 'buyer.nashik@prisms.gov.in',
      },
      { upsert: true }
    );

    // 4. Seed / Upsert the 4 Representative Published Farmer Lots
    const demoLotsData = [
      {
        lotId: 'LOT-2026-ON01',
        cropName: 'Red Onion',
        variety: 'Garwa',
        grade: 'Grade A',
        provisionalGrade: 'Grade A',
        quantityQtl: 50,
        expectedPricePerQtl: 3000,
        minimumAcceptablePrice: 2700,
        suggestedOfferPrice: 3100,
        offerId: 'OFR-2026-0101',
        qualityScore: 92,
        evidenceConfidence: 82,
        origin: 'Farm Gate, Niphad',
        district: 'Nashik',
        parametersList: [
          { name: 'Predominant Bulb Size', value: 'Large (> 60mm)', unit: 'Category', score: 100 },
          { name: 'Bulb Size Uniformity', value: 'Uniform', unit: 'Category', score: 100 },
          { name: 'Rot / Disease', value: 1.5, unit: '%', score: 95 },
          { name: 'Sprouting', value: 0.5, unit: '%', score: 100 },
          { name: 'Neck Drying (Curing)', value: 'Well Dried', unit: 'Condition', score: 100 },
          { name: 'Bulb Firmness', value: 'Firm & Solid', unit: 'Texture', score: 100 },
        ],
      },
      {
        lotId: 'LOT-2026-WH02',
        cropName: 'Wheat',
        variety: 'Sharbati',
        grade: 'Grade A',
        provisionalGrade: 'Grade A',
        quantityQtl: 60,
        expectedPricePerQtl: 2750,
        minimumAcceptablePrice: 2500,
        suggestedOfferPrice: 2700,
        offerId: 'OFR-2026-0102',
        qualityScore: 95,
        evidenceConfidence: 85,
        origin: 'APMC Yard, Lasalgaon',
        district: 'Nashik',
        parametersList: [
          { name: 'Moisture Content', value: 10.5, unit: '%', score: 100 },
          { name: 'Foreign Matter', value: 0.8, unit: '%', score: 100 },
          { name: 'Damaged / Discoloured', value: 1.0, unit: '%', score: 95 },
          { name: 'Weevil Damaged Grains', value: 0, unit: '%', score: 100 },
          { name: 'Grain Lustre & Colour', value: 'Bold Amber Lustrous', unit: 'Category', score: 100 },
        ],
      },
      {
        lotId: 'LOT-2026-FB77',
        cropName: 'Yellow Soybeans',
        variety: 'JS-335',
        grade: 'Grade A',
        provisionalGrade: 'Grade A',
        quantityQtl: 40,
        expectedPricePerQtl: 4200,
        minimumAcceptablePrice: 3900,
        suggestedOfferPrice: 4200,
        offerId: 'OFR-2026-FB77',
        qualityScore: 93,
        evidenceConfidence: 86,
        origin: 'Farm Gate, Latur',
        district: 'Latur',
        parametersList: [
          { name: 'Moisture Content', value: 9.8, unit: '%', score: 100 },
          { name: 'Oil Content Benchmark', value: 'High (> 19%)', unit: 'Category', score: 100 },
          { name: 'Foreign Matter / Pods', value: 0.5, unit: '%', score: 100 },
          { name: 'Split / Immature Grains', value: 1.2, unit: '%', score: 95 },
        ],
      },
      {
        lotId: 'LOT-2026-TM03',
        cropName: 'Tomato',
        variety: 'Abhinav',
        grade: 'Grade A',
        provisionalGrade: 'Grade A',
        quantityQtl: 40,
        expectedPricePerQtl: 2800,
        minimumAcceptablePrice: 2500,
        suggestedOfferPrice: 2800,
        offerId: 'OFR-2026-0103',
        qualityScore: 90,
        evidenceConfidence: 80,
        origin: 'Farm Gate, Pimpalgaon',
        district: 'Nashik',
        parametersList: [
          { name: 'Ripeness & Colour Stage', value: 'Breaker / Turning (10-30% pink)', unit: 'Stage', score: 100 },
          { name: 'Fruit Firmness', value: 'Very Firm', unit: 'Texture', score: 100 },
          { name: 'Cracking / Bruising', value: 2.0, unit: '%', score: 90 },
          { name: 'Pest Spots / Blight', value: 0.5, unit: '%', score: 95 },
        ],
      },
    ];

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);

    for (const item of demoLotsData) {
      // Upsert Trade Lot
      const lot = await Lot.findOneAndUpdate(
        { lotId: item.lotId },
        {
          lotId: item.lotId,
          userId: farmerId,
          cropName: item.cropName,
          variety: item.variety,
          grade: item.grade,
          provisionalGrade: item.provisionalGrade,
          quantityQtl: item.quantityQtl,
          expectedPricePerQtl: item.expectedPricePerQtl,
          minimumAcceptablePrice: item.minimumAcceptablePrice,
          qualityScore: item.qualityScore,
          evidenceConfidence: item.evidenceConfidence,
          qualityPassport: {
            crop: item.cropName,
            provisionalGrade: item.provisionalGrade,
            qualityScore: item.qualityScore,
            evidenceConfidence: item.evidenceConfidence,
            parametersList: item.parametersList,
            verificationStatus: 'Provisional — Farmer Submitted Assessment',
            disclaimer: 'Assessment is provisional and based on farmer-submitted measurements.',
          },
          origin: item.origin,
          district: item.district,
          buyerVisibility: 'PUBLIC',
          lotStatus: 'PUBLISHED',
        },
        { upsert: true, new: true }
      );

      // Check if an active offer already exists for this lot
      const existingOffer = await Offer.findOne({
        $or: [
          { lotId: lot.lotId },
          { lotId: lot._id },
          { lotId: String(lot._id) },
        ],
        buyerId: { $in: [buyerId, 'DEMO-BUYER-01', 'buyer.nashik@prisms.gov.in'] },
        offerStatus: { $in: ['PENDING', 'COUNTERED', 'ACCEPTED'] },
      });

      if (!existingOffer) {
        const qty = item.quantityQtl;
        const price = item.suggestedOfferPrice;
        const gross = qty * price;
        const freight = Math.round(25 * 1.35 * qty);
        const handling = Math.round(gross * 0.005);
        const spoilage = Math.round(gross * 0.015);
        const net = gross - freight - handling - spoilage;

        await Offer.findOneAndUpdate(
          { offerId: item.offerId },
          {
            offerId: item.offerId,
            lotId: lot.lotId,
            buyerId,
            sellerUserId: farmerId,
            commodity: item.cropName,
            variety: item.variety,
            grade: item.grade,
            quantityQtl: qty,
            pricePerQtl: price,
            grossValue: gross,
            estimatedTransportCost: freight,
            estimatedLabourCost: 0,
            estimatedSpoilage: spoilage,
            estimatedMarketHandlingCharges: handling,
            estimatedNetRealization: net,
            paymentTerms: 'T+1 Escrow Direct Bank Transfer',
            deliveryTerms: 'Buyer Pickup from Farm Gate',
            pickupLocation: item.origin,
            deliveryLocation: 'Nashik Agro Processing Hub, Ambad MIDC',
            expiresAt: expiryDate,
            offerStatus: 'PENDING',
            isDemo: false,
          },
          { upsert: true }
        );
      }
    }

    console.log('✅ PRISMS Real Farmer Trade Lots & Multi-Crop Buyer Offers Seeded Successfully!');
  } catch (err) {
    console.error('❌ Error seeding demo trade lots & offers:', err);
  }
}
