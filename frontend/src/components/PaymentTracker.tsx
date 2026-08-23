import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle, ShieldCheck, DollarSign, RefreshCw, Lock } from 'lucide-react';
import { PaymentLedger, DeliveryOrder, fetchUserPayments, fetchUserDeliveries, updatePaymentStatusApi } from '../lib/prisms';
import { t } from '../lib/i18n';

export const PaymentTracker: React.FC = () => {
  const [payments, setPayments] = useState<PaymentLedger[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const handleReset = () => loadData();
    window.addEventListener("prisms:reset_demo_data", handleReset);
    return () => window.removeEventListener("prisms:reset_demo_data", handleReset);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [pData, dData] = await Promise.all([
        fetchUserPayments(),
        fetchUserDeliveries(),
      ]);
      setPayments(pData);
      setDeliveries(dData);
    } catch (err: any) {
      console.error("Error loading payment ledger", err);
      setErrorState("Unable to load payment record.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayout = async (payment: PaymentLedger) => {
    const pId = payment.paymentId || payment._id;
    if (releasingId === pId) return;

    // 1. Find linked delivery record to validate delivery status
    const linkedDelivery = deliveries.find(d =>
      (d.offerId && (d.offerId === payment.offerId)) ||
      (d.lotId && (d.lotId === payment.lotId))
    );

    const isDelivered = linkedDelivery ? linkedDelivery.deliveryStatus === 'DELIVERED' : false;

    if (!isDelivered) {
      setStatusMessage("Payment pending delivery completion. Complete delivery in Delivery Tracking first.");
      return;
    }

    const currentStatus = payment.paymentStatus || 'PENDING';
    if (currentStatus === 'PAID' || currentStatus === 'RELEASED') {
      setStatusMessage("Payout has already been released for this deal.");
      return;
    }

    setReleasingId(pId);
    try {
      setStatusMessage(`Releasing simulated bank payout for ${payment.paymentId}...`);
      const nowIso = new Date().toISOString();
      const isBackendMode = localStorage.getItem("prisms_token") && !localStorage.getItem("prisms_token")?.startsWith("demo_token_");

      if (isBackendMode) {
        // Strict Backend Flow: API MUST succeed first
        await updatePaymentStatusApi(payment.paymentId, 'PAID');
        
        setPayments(prevPayments =>
          prevPayments.map(p => {
            if (p.paymentId === pId || p._id === pId) {
              return {
                ...p,
                paymentStatus: 'RELEASED' as any,
                paidDate: nowIso,
              };
            }
            return p;
          })
        );
      } else {
        // DEMO Flow: Update React state and localStorage
        setPayments(prevPayments =>
          prevPayments.map(p => {
            if (p.paymentId === pId || p._id === pId) {
              return {
                ...p,
                paymentStatus: 'RELEASED' as any,
                paidDate: nowIso,
              };
            }
            return p;
          })
        );

        const rawLocal = localStorage.getItem("prisms_demo_payments");
        let localPayments: PaymentLedger[] = rawLocal ? JSON.parse(rawLocal) : [];
        let foundInLocal = false;

        localPayments = localPayments.map(p => {
          if (p.paymentId === pId || p._id === pId) {
            foundInLocal = true;
            return {
              ...p,
              paymentStatus: 'RELEASED' as any,
              paidDate: nowIso,
            };
          }
          return p;
        });

        if (!foundInLocal) {
          localPayments.unshift({
            ...payment,
            paymentStatus: 'RELEASED' as any,
            paidDate: nowIso,
          });
        }
        localStorage.setItem("prisms_demo_payments", JSON.stringify(localPayments));

        const rawTxns = localStorage.getItem("prisms_demo_transactions");
        if (rawTxns) {
          let txns: any[] = JSON.parse(rawTxns);
          txns = txns.map(t => {
            if (t.offerId === payment.offerId || t.lotId === payment.lotId) {
              return { ...t, transactionStatus: 'PAYMENT_COMPLETED' };
            }
            return t;
          });
          localStorage.setItem("prisms_demo_transactions", JSON.stringify(txns));
        }
      }

      setStatusMessage("Demo payout released successfully.");
    } catch (err: any) {
      console.error("Payout release failed", err);
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message || "Failed to release payout"}`);
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
              <CreditCard className="w-3.5 h-3.5" />
              Digital Escrow Settlement
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payment Tracking & Escrow Ledger
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              Automated trade settlement and escrow records linked to verified delivery milestones.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-700">
              <span className="font-bold block text-slate-900 text-[11px]">
                1 Deal = 1 Payment Record
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Strict payout release validation requiring completed delivery.
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
          <span className="text-xs font-semibold">Loading payment ledger...</span>
        </div>
      ) : (errorState && payments.length === 0) ? (
        <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-1" />
          <h3 className="text-base font-bold text-slate-800">Unable to load payment record</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            Network or authorization issue while fetching payment records.
          </p>
          <button
            onClick={() => loadData()}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <CreditCard className="w-10 h-10 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No active payment records</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            Accepted deals with payment records will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {payments.map(pmt => {
            const raw = pmt as any;
            const gross = pmt.grossAmount ?? raw.grossValue ?? 110100;
            const net = pmt.netPayable ?? raw.netAmount ?? 107897;
            const deduct = pmt.deductions ?? raw.estimatedDeductions ?? Math.max(0, gross - net);

            const status = pmt.paymentStatus || raw.status || 'PENDING';
            const isReleased = status === 'RELEASED' || status === 'PAID';
            const buyerName = pmt.buyer?.businessName || raw.buyerName || 'Nashik Agro Processors Ltd.';

            const linkedDelivery = deliveries.find(d =>
              (d.offerId && (d.offerId === pmt.offerId)) ||
              (d.lotId && (d.lotId === pmt.lotId))
            );
            const isDeliveryDelivered = linkedDelivery ? linkedDelivery.deliveryStatus === 'DELIVERED' : false;

            const refId = pmt.referenceId || `REF-2026-${(pmt.paymentId || '000').slice(-4)}`;
            const mode = pmt.paymentMode || raw.paymentMode || 'DEMO_BANK_TRANSFER';

            let dueDateStr = 'Pending';
            if (pmt.dueDate) {
              const d = new Date(pmt.dueDate);
              if (!isNaN(d.getTime())) dueDateStr = d.toLocaleDateString();
            }

            let paidDateStr: string | null = null;
            if (pmt.paidDate) {
              const d = new Date(pmt.paidDate);
              if (!isNaN(d.getTime())) {
                paidDateStr = d.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
              }
            }

            return (
              <div
                id={`payment-${pmt.paymentId}`}
                key={pmt._id || pmt.paymentId}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          Payment ID: {pmt.paymentId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Ref: {refId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          isReleased
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isReleased ? 'PAID / RELEASED' : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{buyerName}</span>
                        <span>•</span>
                        <span>Mode: {mode}</span>
                        <span>•</span>
                        <span>Due Date: {dueDateStr}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {!isReleased ? (
                      <button
                        disabled={!isDeliveryDelivered || releasingId === (pmt._id || pmt.paymentId)}
                        onClick={() => handleSimulatePayout(pmt)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
                          isDeliveryDelivered
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                        title={!isDeliveryDelivered ? "Payment pending delivery completion. Complete delivery in Delivery Tracking first." : ""}
                      >
                        {releasingId === (pmt._id || pmt.paymentId) ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Releasing...
                          </>
                        ) : !isDeliveryDelivered ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            Payment Pending Delivery Completion
                          </>
                        ) : (
                          <>Simulate Payout Release →</>
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ✓ Payout Released
                        </span>
                        {paidDateStr && (
                          <span className="text-[10px] text-slate-500 font-medium mt-1">
                            Released On: {paidDateStr}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Ledger Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Gross Sale Amount</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">₹{gross.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Logistics & Handling Deductions</div>
                    <div className="text-lg font-bold text-rose-600 mt-1">-₹{deduct.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-800">Net Payable to Farmer Account</div>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">₹{net.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Success Banner when Released */}
                {isReleased && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ✓ PAYMENT SUCCESSFUL
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 uppercase tracking-wider">
                        Transaction: PAYMENT_COMPLETED
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Demo payment released successfully.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-emerald-200/60 font-medium">
                      <div>
                        <span className="text-emerald-600 text-[11px] block">Amount Released:</span>
                        <strong className="text-emerald-900 text-sm font-extrabold">₹{net.toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-600 text-[11px] block">Payment ID:</span>
                        <strong className="text-emerald-900 font-bold">{pmt.paymentId}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-600 text-[11px] block">Released On:</span>
                        <strong className="text-emerald-900 font-bold">{paidDateStr || "Just now"}</strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700/90 pt-1 font-medium italic">
                      Verified automated escrow payout record.
                    </div>
                  </div>
                )}

                {/* Footer notes */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2 font-medium">
                  <span>Notes: {pmt.notes || 'Digital Escrow Settlement Record'}</span>
                  {paidDateStr && (
                    <span className="text-emerald-700 font-bold">
                      Settlement Timestamp: {paidDateStr}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

