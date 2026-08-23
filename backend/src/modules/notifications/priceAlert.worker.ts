import { PriceAlert } from './priceAlert.model';
import { Notification } from './notification.model';
import { Price } from '../prices/price.model';
import '../markets/market.model';
import mongoose from 'mongoose';

let isWorkerRunning = false;
let workerTimer: NodeJS.Timeout | null = null;

async function generateNotificationId(): Promise<string> {
  const count = await Notification.countDocuments();
  const hex = (count + 601).toString(16).toUpperCase().padStart(4, '0');
  return `NTF-2026-${hex}`;
}

export async function runPriceAlertWorker(): Promise<{ processed: number; triggered: number }> {
  if (isWorkerRunning) {
    console.log('⏳ Price Alert Worker is already executing. Skipping overlapping run.');
    return { processed: 0, triggered: 0 };
  }

  isWorkerRunning = true;
  let processedCount = 0;
  let triggeredCount = 0;

  try {
    const enabledAlerts = await PriceAlert.find({ isEnabled: true });
    processedCount = enabledAlerts.length;

    for (const alert of enabledAlerts) {
      // 1. Fetch latest price record for matching commodity & market
      const query: any = {
        commodity: new RegExp(`^${alert.commodity}$`, 'i'),
      };

      const latestPriceDoc = await Price.findOne(query).populate('marketId').sort({ date: -1 });
      if (!latestPriceDoc) continue;

      const currentPriceQtl = latestPriceDoc.modalPrice > 100 ? latestPriceDoc.modalPrice : Math.round(latestPriceDoc.modalPrice * 100);
      const recordId = latestPriceDoc._id.toString();

      // 2. Evaluate Alert Condition
      let isConditionMet = false;
      if (alert.condition === 'PRICE_AT_OR_ABOVE') {
        isConditionMet = currentPriceQtl >= alert.targetPrice;
      } else if (alert.condition === 'PRICE_AT_OR_BELOW') {
        isConditionMet = currentPriceQtl <= alert.targetPrice;
      }

      // 3. Deterministic Duplicate Prevention Strategy:
      // Skip if the same price record ID has already triggered this alert
      if (isConditionMet) {
        if (alert.lastTriggeredRecordId === recordId) {
          // Already notified for this exact price record
          continue;
        }

        // Determine Data Provenance source tag
        const isLiveGovt = latestPriceDoc.source === 'LIVE_GOVT_API';
        const sourceLabel = isLiveGovt
          ? 'Latest Government Mandi Data (Data.gov.in)'
          : 'Verified Historical APMC Benchmark Data';

        const marketDisplay = alert.marketName || (latestPriceDoc.marketId as any)?.name || 'Regional Mandi';

        // 4. Automatically create Notification without manual API call
        const notificationId = await generateNotificationId();
        await Notification.create({
          notificationId,
          userId: alert.userId,
          type: 'PRICE_ALERT',
          title: `Price Target Reached: ${alert.commodity}`,
          message: `${marketDisplay} ${alert.commodity} is ₹${currentPriceQtl.toLocaleString('en-IN')}/Qtl, reaching your target of ₹${alert.targetPrice.toLocaleString('en-IN')}/Qtl. Source: ${sourceLabel}.`,
          severity: 'HIGH',
          relatedCrop: alert.commodity,
          relatedMarket: marketDisplay,
          isRead: false,
        });

        // 5. Update PriceAlert last triggered metadata
        alert.lastTriggeredAt = new Date();
        alert.lastTriggeredRecordId = recordId;
        await alert.save();

        triggeredCount++;
      }
    }
  } catch (err) {
    console.error('❌ Error executing Price Alert Worker:', err);
  } finally {
    isWorkerRunning = false;
  }

  return { processed: processedCount, triggered: triggeredCount };
}

export function startPriceAlertWorker(intervalMs: number = 300000) {
  if (workerTimer) {
    console.log('⚠️ Price Alert Worker scheduler is already initialized.');
    return;
  }

  console.log(`🚀 Initializing PRISMS Automated Price Alert Worker (Frequency: Every ${intervalMs / 1000}s)`);
  
  // Initial run after server boot
  setTimeout(() => {
    runPriceAlertWorker();
  }, 10000);

  // Periodic scheduler loop
  workerTimer = setInterval(() => {
    runPriceAlertWorker();
  }, intervalMs);
}
