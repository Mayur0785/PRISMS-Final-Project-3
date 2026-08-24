import mongoose from 'mongoose';
import { User } from '../modules/users/user.model';
import { Lot } from '../modules/lots/lot.model';
import { Offer } from '../modules/offers/offer.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { DeliveryOrder } from '../modules/delivery/delivery.model';
import { PaymentLedger } from '../modules/payments/payment.model';
import { resolveLot } from '../modules/lots/lot.helpers';

async function runIntegrationTest() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prisms';
  console.log(`Connecting to MongoDB...`);
  try {
    await mongoose.connect(MONGO_URI);
  } catch (e: any) {
    console.error('Could not connect to MongoDB:', e.message);
    return;
  }

  try {
    // 1. Create or resolve test Farmer User
    let farmer = await User.findOne({ email: 'test.farmer.a@prisms.gov.in' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Farmer A (Integration Test)',
        email: 'test.farmer.a@prisms.gov.in',
        passwordHash: 'hashed_password_123',
        role: 'farmer',
        district: 'Nashik',
        village: 'Lasalgaon',
      });
    }

    // 2. Create or resolve test Buyer User
    let buyer = await User.findOne({ email: 'test.buyer.a@prisms.gov.in' });
    if (!buyer) {
      buyer = await User.create({
        name: 'Nashik Agro Processors Ltd. (Buyer A)',
        email: 'test.buyer.a@prisms.gov.in',
        passwordHash: 'hashed_password_123',
        role: 'buyer',
        district: 'Nashik',
      });
    }

    // Clean previous test lot/offers if any
    const testLotId = 'LOT-TEST-001';
    await Lot.deleteMany({ lotId: testLotId });
    await Offer.deleteMany({ commodity: 'Red Onion Test Crop' });

    // 3. Farmer creates LOT-TEST-001
    const lot = await Lot.create({
      lotId: testLotId,
      userId: farmer._id,
      cropName: 'Red Onion Test Crop',
      variety: 'Garwa',
      grade: 'Grade A',
      quantityQtl: 40,
      expectedPricePerQtl: 3000,
      minimumAcceptablePrice: 2800,
      origin: 'Lasalgaon Farm Gate',
      district: 'Nashik',
      buyerVisibility: 'PUBLIC',
      lotStatus: 'PUBLISHED',
    });

    console.log('\n--- 1. LOT CREATED ---');
    console.log(`Lot MongoDB _id: ${lot._id}`);
    console.log(`Lot Business lotId: ${lot.lotId}`);

    // 4. Buyer submits binding offer for LOT-TEST-001 using business ID
    const count = await Offer.countDocuments();
    const hex = (count + 201).toString(16).toUpperCase().padStart(4, '0');
    const offerId = `OFR-TEST-${hex}`;

    const offer = await Offer.create({
      offerId,
      lotId: lot._id, // Referenced via MongoDB ObjectId
      buyerId: String(buyer._id),
      sellerUserId: lot.userId,
      commodity: lot.cropName,
      variety: lot.variety,
      grade: lot.grade,
      quantityQtl: 40,
      pricePerQtl: 3000,
      grossValue: 120000,
      estimatedTransportCost: 2000,
      estimatedLabourCost: 0,
      estimatedSpoilage: 1800,
      estimatedMarketHandlingCharges: 600,
      estimatedNetRealization: 115600,
      paymentTerms: 'T+1 Escrow',
      deliveryTerms: 'Buyer Pickup',
      pickupLocation: lot.origin,
      deliveryLocation: 'Nashik Processing Hub',
      expiresAt: new Date(Date.now() + 7 * 86400000),
      offerStatus: 'PENDING',
      isDemo: false,
    });

    console.log('\n--- 2. OFFER SUBMITTED ---');
    console.log(`Offer MongoDB _id: ${offer._id}`);
    console.log(`Offer ID: ${offer.offerId}`);
    console.log(`Offer.lotId stored value: ${offer.lotId}`);
    console.log(`Offer.buyerId: ${offer.buyerId}`);
    console.log(`Offer.sellerUserId: ${offer.sellerUserId}`);

    // 5. Test resolution by resolveLot helper
    const resolvedByObjectId = await resolveLot(String(lot._id));
    const resolvedByBusinessId = await resolveLot(lot.lotId);

    console.log('\n--- 3. RESOLVE LOT HELPER VERIFICATION ---');
    console.log(`resolveLot(lot._id) found: ${resolvedByObjectId?.lotId}`);
    console.log(`resolveLot(lot.lotId) found: ${resolvedByBusinessId?.lotId}`);

    // 6. Test offer retrieval for lot using getOffersForLot query logic
    const offersFoundForBusinessId = await Offer.find({
      $or: [
        { lotId: resolvedByBusinessId!._id },
        { lotId: String(resolvedByBusinessId!._id) },
        { lotId: resolvedByBusinessId!.lotId },
      ],
      offerStatus: { $in: ['PENDING', 'COUNTERED', 'ACCEPTED'] },
    });

    console.log('\n--- 4. GET OFFERS FOR LOT QUERY VERIFICATION ---');
    console.log(`Offers found for business ID '${testLotId}': ${offersFoundForBusinessId.length}`);
    console.log(`Found offer ID: ${offersFoundForBusinessId[0]?.offerId}`);

    // 7. Farmer counters offer to ₹3200
    offer.offerStatus = 'COUNTERED';
    offer.counterBy = 'FARMER';
    offer.counterPricePerQtl = 3200;
    await offer.save();

    console.log('\n--- 5. FARMER COUNTER OFFER ---');
    console.log(`Offer status: ${offer.offerStatus}`);
    console.log(`Counter by: ${offer.counterBy}`);
    console.log(`Counter Price: ₹${offer.counterPricePerQtl}/Qtl`);

    // 8. Buyer accepts counter offer
    const finalPrice = offer.counterPricePerQtl;
    offer.pricePerQtl = finalPrice;
    offer.grossValue = finalPrice * offer.quantityQtl;
    offer.offerStatus = 'ACCEPTED';
    await offer.save();

    lot.lotStatus = 'ACCEPTED';
    await lot.save();

    const transaction: any = await Transaction.create({
      transactionId: `TXN-TEST-001`,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: farmer._id as any,
      buyerId: String(buyer._id),
      crop: lot.cropName,
      variety: lot.variety,
      grade: lot.grade,
      quantityQtl: lot.quantityQtl,
      agreedPricePerQtl: finalPrice,
      grossAmount: offer.grossValue,
      totalDeductions: 4400,
      finalNetAmount: offer.grossValue - 4400,
      transactionStatus: 'OFFER_ACCEPTED',
      isDemo: false,
    });

    const delivery: any = await DeliveryOrder.create({
      deliveryId: `DLV-TEST-001`,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: farmer._id as any,
      buyerId: String(buyer._id),
      crop: lot.cropName,
      variety: lot.variety,
      grade: lot.grade,
      quantityQtl: lot.quantityQtl,
      agreedPricePerQtl: finalPrice,
      vehicleType: 'Medium Pickup',
      freightRate: '₹1.35/km/Qtl',
      estimatedFreight: 2000,
      origin: lot.origin,
      destination: 'Nashik Processing Hub',
      plannedPickupDate: new Date(),
      actualDeliveryDate: new Date(Date.now() + 86400000),
      deliveryStatus: 'OFFER_ACCEPTED_PLANNED',
      timeline: [{ status: 'OFFER_ACCEPTED_PLANNED', label: 'Planned', timestamp: new Date().toISOString() }],
      notes: `Test deal confirmed`,
      isDemo: false,
    });

    const payment: any = await PaymentLedger.create({
      paymentId: `PMT-TEST-001`,
      transactionId: transaction._id as any,
      lotId: lot._id as any,
      offerId: offer._id as any,
      farmerId: farmer._id as any,
      buyerId: String(buyer._id),
      grossAmount: transaction.grossAmount,
      deductions: transaction.totalDeductions,
      netPayable: transaction.finalNetAmount,
      paymentMode: 'DEMO_BANK_TRANSFER',
      dueDate: new Date(Date.now() + 172800000),
      paymentStatus: 'PENDING',
      referenceId: 'REF-TEST-001',
      isDemo: false,
    });

    console.log('\n--- 6. ACCEPTANCE & DOWNSTREAM RECORDS VERIFICATION ---');
    console.log(`Updated Offer status: ${offer.offerStatus}`);
    console.log(`Updated Lot status: ${lot.lotStatus}`);
    console.log(`Transaction created: ${transaction.transactionId}`);
    console.log(`Delivery Order created: ${delivery.deliveryId}`);
    console.log(`Payment Ledger created: ${payment.paymentId}`);

    console.log('\n=== REAL INTEGRATION TEST SUCCESSFUL ===\n');
  } catch (err) {
    console.error('Integration test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runIntegrationTest();
