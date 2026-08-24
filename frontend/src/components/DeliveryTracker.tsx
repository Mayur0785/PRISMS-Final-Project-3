import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, AlertCircle, MapPin, Calendar, ArrowRight, ShieldCheck, RefreshCw, PackageCheck, UserCheck, DollarSign } from 'lucide-react';
import { DeliveryOrder, fetchUserDeliveries, updateDeliveryStatusApi, advanceDemoDeliveryApi, type DeliveryTimelineEvent } from '../lib/prisms';
import { t } from '../lib/i18n';

function safeFormatDate(rawDate?: string | Date): string {
  if (!rawDate) return "ETA not available";
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return "ETA not available";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

interface DeliveryTrackerProps {
  onNavigateToPayment?: (paymentId?: string, lotId?: string) => void;
}

export const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ onNavigateToPayment }) => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
    const handleReset = () => loadDeliveries();
    window.addEventListener("prisms:reset_demo_data", handleReset);
    return () => window.removeEventListener("prisms:reset_demo_data", handleReset);
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await fetchUserDeliveries();
      setDeliveries(data);
    } catch (err: any) {
      console.error("Error loading delivery orders", err);
      setErrorState("Unable to load delivery orders.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'OFFER_ACCEPTED_PLANNED':
      case 'PLANNED':
        return 'Offer Accepted & Planned';
      case 'PICKUP_READY':
        return 'Pickup Ready';
      case 'DISPATCHED':
        return 'Dispatched';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered to Buyer';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleAdvanceStatus = async (delivery: DeliveryOrder) => {
    const dId = delivery.deliveryId || delivery._id;
    if (advancingId === dId) return; // Idempotency guard against rapid multi-clicks

    // Fetch latest record from React state
    const targetDelivery = deliveries.find(d => (d.deliveryId === dId || d._id === dId)) || delivery;
    if (targetDelivery.deliveryStatus === 'DELIVERED') return;

    setAdvancingId(dId);
    try {
      setStatusMessage(`Advancing delivery ${targetDelivery.deliveryId} to DELIVERED (Demo Shortcut)...`);
      const nowIso = new Date().toISOString();
      const isBackendMode = localStorage.getItem("prisms_token") && !localStorage.getItem("prisms_token")?.startsWith("demo_token_");

      let updatedRecord: DeliveryOrder | null = null;
      if (isBackendMode) {
        updatedRecord = await advanceDemoDeliveryApi(targetDelivery.deliveryId);
      }

      const completeTimeline: DeliveryTimelineEvent[] = updatedRecord?.timeline || [
        { status: 'OFFER_ACCEPTED_PLANNED', label: 'Offer Accepted & Planned', timestamp: targetDelivery.createdAt || nowIso },
        { status: 'PICKUP_READY', label: 'Pickup Ready', timestamp: nowIso },
        { status: 'DISPATCHED', label: 'Dispatched', timestamp: nowIso },
        { status: 'IN_TRANSIT', label: 'In Transit', timestamp: nowIso },
        { status: 'DELIVERED', label: 'Delivered to Buyer', timestamp: nowIso },
      ];

      setDeliveries(prevDeliveries =>
        prevDeliveries.map(d => {
          if (d.deliveryId === dId || d._id === dId) {
            return {
              ...d,
              ...(updatedRecord || {}),
              deliveryStatus: 'DELIVERED',
              updatedAt: nowIso,
              actualDeliveryDate: nowIso,
              timeline: completeTimeline,
            };
          }
          return d;
        })
      );

      setStatusMessage(`Delivery status updated to Delivered to Buyer!`);
    } catch (err: any) {
      console.error("Delivery advance failed", err);
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message || "Failed to update delivery status"}`);
    } finally {
      setAdvancingId(null);
    }
  };

  const getTimelineSteps = (delivery: DeliveryOrder) => {
    const steps = [
      { status: 'OFFER_ACCEPTED_PLANNED', label: 'Offer Accepted & Planned' },
      { status: 'PICKUP_READY', label: 'Pickup Ready' },
      { status: 'DISPATCHED', label: 'Dispatched' },
      { status: 'IN_TRANSIT', label: 'In Transit' },
      { status: 'DELIVERED', label: 'Delivered to Buyer' },
    ];

    const currentStatus = delivery.deliveryStatus === 'PLANNED' ? 'OFFER_ACCEPTED_PLANNED' : delivery.deliveryStatus;
    const order = ['OFFER_ACCEPTED_PLANNED', 'PICKUP_READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = order.indexOf(currentStatus);

    return steps.map((step, idx) => {
      const timelineEvent = (delivery.timeline || []).find(t => t.status === step.status || (step.status === 'OFFER_ACCEPTED_PLANNED' && t.status === 'PLANNED'));
      return {
        ...step,
        isComplete: idx <= currentIndex,
        isCurrent: idx === currentIndex,
        timestamp: timelineEvent?.timestamp || (idx === 0 ? delivery.createdAt : null),
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
              <Truck className="w-3.5 h-3.5" />
              Demo Logistics Tracking
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Logistics & Delivery Order Tracking
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              Simulated delivery milestones — no real transport dispatch is initiated.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-700">
              <span className="font-bold block text-slate-900 text-[11px]">
                1 Accepted Deal = 1 Delivery Order
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Strict idempotency across delivery, payment, and transaction records.
              </span>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-sm">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">Loading delivery orders...</span>
        </div>
      ) : errorState ? (
        <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-1" />
          <h3 className="text-base font-bold text-slate-800">{errorState}</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            A network error or server timeout occurred while fetching delivery tracking orders.
          </p>
          <button
            onClick={() => loadDeliveries()}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <PackageCheck className="w-10 h-10 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No active deliveries</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            Accepted deals with delivery orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {deliveries.map(delivery => {
            const steps = getTimelineSteps(delivery);
            const isDelivered = delivery.deliveryStatus === 'DELIVERED';
            const buyerName = delivery.buyer?.businessName || delivery.buyerId || 'Matched Buyer';
            const cropName = delivery.crop && delivery.crop !== 'Produce' ? delivery.crop : 'Red Onion (Nashik)';
            const agreedPrice = delivery.agreedPricePerQtl || 3200;
            const freightRateText = delivery.freightRate || '₹1.35/km/Qtl';
            const estimatedFreightVal = delivery.estimatedFreight || Math.round(1.35 * 35 * (delivery.quantityQtl || 30));

            return (
              <div
                key={delivery._id || delivery.deliveryId}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6"
              >
                {/* Top Info Header */}
                <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 mt-0.5">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          Delivery Order: {delivery.deliveryId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {delivery.vehicleType}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {getStatusLabel(delivery.deliveryStatus)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{cropName}</span>
                        <span>•</span>
                        <span>{delivery.quantityQtl} Qtl</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">₹{agreedPrice.toLocaleString('en-IN')}/Qtl</span>
                        <span>•</span>
                        <span className="text-slate-500">Destination: {delivery.destination}</span>
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Action Area */}
                  <div className="flex flex-col items-end gap-2 shrink-0 sm:self-start">
                    {!isDelivered ? (
                      <button
                        disabled={advancingId === (delivery._id || delivery.deliveryId)}
                        onClick={() => handleAdvanceStatus(delivery)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {advancingId === (delivery._id || delivery.deliveryId) ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>Advance Delivery Status →</>
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onNavigateToPayment) {
                              onNavigateToPayment(delivery.paymentId, delivery.lotId);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          Proceed to Payment →
                        </button>
                        <div className="flex flex-col items-end gap-0.5 text-right">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ✓ Delivery Completed
                          </span>
                          {delivery.actualDeliveryDate && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Delivered On: {new Date(delivery.actualDeliveryDate).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Visualizer */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Delivery Timeline
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {steps.map((step, idx) => (
                      <div
                        key={step.status}
                        className={`p-3 rounded-xl border flex flex-col justify-between text-xs transition-all ${
                          step.isCurrent
                            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                            : step.isComplete
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {step.isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : step.isCurrent ? (
                            <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                              {idx + 1}
                            </div>
                          )}
                          <span className="truncate leading-tight">{step.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {step.timestamp
                            ? new Date(step.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "Pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics Metadata Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Planned Pickup: <strong>{safeFormatDate(delivery.plannedPickupDate)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Est. Delivery: <strong>{safeFormatDate(delivery.expectedDeliveryDate)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700">
                      Transport Rate: <strong className="text-emerald-700 font-bold">{freightRateText}</strong> • Freight: <strong className="text-slate-900 font-bold">₹{estimatedFreightVal.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

