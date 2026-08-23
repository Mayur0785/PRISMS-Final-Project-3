import React, { useState, useEffect, useCallback } from 'react';
import { Tag, CheckCircle2, XCircle, ArrowRightLeft, Building2, MapPin, Clock, ShieldCheck, Scale, AlertCircle, FileText } from 'lucide-react';
import { TradeLot, Offer, fetchUserLots, fetchOffersForLot, acceptOfferApi, createDeliveryOrderApi, rejectOfferApi, recordOfferAcceptance, getAcceptedOfferForLot, getAuthMode } from '../lib/prisms';
import { OfferComparisonModal } from './OfferComparisonModal';
import { t } from '../lib/i18n';

interface DigitalOffersManagerProps {
  lang?: 'en' | 'mr';
}

export const DigitalOffersManager: React.FC<DigitalOffersManagerProps> = ({ lang = 'en' }) => {
  const [lots, setLots] = useState<TradeLot[]>([]);
  const [lotOffersMap, setLotOffersMap] = useState<Record<string, Offer[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLotForModal, setSelectedLotForModal] = useState<TradeLot | null>(null);
  const [acceptedOffersMap, setAcceptedOffersMap] = useState<Record<string, string>>({});
  const [rejectedOfferIds, setRejectedOfferIds] = useState<Record<string, boolean>>({});
  const [dealConfirmedModal, setDealConfirmedModal] = useState<{ offer: Offer; lot: TradeLot } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedLots = await fetchUserLots();
      const lotsArr = fetchedLots || [];
      setLots(lotsArr);

      // Fetch real offers for each lot in parallel
      const offersMap: Record<string, Offer[]> = {};
      await Promise.all(
        lotsArr.map(async (lot) => {
          const lotKey = lot._id || lot.lotId;
          try {
            const offs = await fetchOffersForLot(lotKey);
            offersMap[lotKey] = Array.isArray(offs) ? offs : [];
          } catch {
            offersMap[lotKey] = [];
          }
        })
      );
      setLotOffersMap(offersMap);

      // Check accepted offers
      const acceptedMap: Record<string, string> = {};
      lotsArr.forEach(lot => {
        const lotKey = lot._id || lot.lotId;
        const offs = offersMap[lotKey] || [];
        const acceptedOff = offs.find(o => o.offerStatus === 'ACCEPTED');
        if (acceptedOff) {
          acceptedMap[lotKey] = acceptedOff._id || acceptedOff.offerId;
        } else if (lot.lotStatus === 'ACCEPTED') {
          acceptedMap[lotKey] = 'ACCEPTED';
        }
      });
      setAcceptedOffersMap(acceptedMap);
    } catch (err) {
      console.error('Error loading trade lots for digital offers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleReset = () => loadData();
    window.addEventListener("prisms:reset_demo_data", handleReset);
    return () => window.removeEventListener("prisms:reset_demo_data", handleReset);
  }, [loadData]);

  const [submitting, setSubmitting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const handleAcceptOffer = async (offer: Offer, lot: TradeLot) => {
    const lotKey = lot._id || lot.lotId;
    if (acceptedOffersMap[lotKey] || submitting) return;

    setSubmitting(true);
    setAcceptError("");

    try {
      const acceptRes = await acceptOfferApi(offer._id || offer.offerId);
      const acceptedOfferId = acceptRes?.offer?._id || offer._id || offer.offerId;

      // Create linked DeliveryOrder, PaymentLedger, and Transaction records on backend
      await createDeliveryOrderApi(acceptedOfferId, "Medium Pickup (Bolero MaxiTruck)");

      setAcceptedOffersMap(prev => ({
        ...prev,
        [lotKey]: acceptedOfferId
      }));
      setDealConfirmedModal({ offer, lot });
      await loadData();
    } catch (err: any) {
      console.error("Error accepting offer via API:", err);
      setAcceptError(err?.response?.data?.error?.message || err?.message || "Failed to accept offer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectOffer = (offerId: string) => {
    setRejectedOfferIds(prev => ({ ...prev, [offerId]: true }));
    rejectOfferApi(offerId).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Tag className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'mr' ? 'डिजिटल ऑफर्स आणि थेट खरेदीदार बोली' : 'Digital Offers & Direct Buyer Bids'}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {lang === 'mr'
                  ? 'आपल्या पिकांच्या लॉटसाठी आलेल्या डिजिटल ऑफर्स पहा, नफा तुलना करा आणि सौदे निश्चित करा.'
                  : 'Review active buyer offers, compare net realization, and negotiate terms for your trade lots.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Loading buyer offers...
          </p>
        </div>
      ) : lots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">No Active Trade Lots Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create a trade lot in My Crops to start receiving direct digital buyer offers.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {lots.map(lot => {
            const lotKey = lot._id || lot.lotId;
            const offers = lotOffersMap[lotKey] || [];
            const acceptedOfferId = acceptedOffersMap[lotKey];

            return (
              <div
                key={lotKey}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Trade Lot Context Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          Trade Lot: {lot.lotId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {lot.cropName}
                        </span>
                        {acceptedOfferId && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            DEAL CONFIRMED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-2 flex-wrap">
                        <span>Quantity: <strong className="text-slate-900">{lot.quantityQtl} Qtl</strong></span>
                        <span>•</span>
                        <span>Expected: <strong className="text-emerald-700">₹{lot.expectedPricePerQtl.toLocaleString('en-IN')}/Qtl</strong></span>
                        {lot.location && lot.location.trim() !== '' && (
                          <>
                            <span>•</span>
                            <span>Location: {lot.location}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLotForModal(lot)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Compare Matrix & Offers →
                  </button>
                </div>

                {/* Received Offers Grid */}
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>BUYER OFFERS RECEIVED ({offers.length})</span>
                  </div>

                  {offers.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-1">
                      <p className="text-xs text-slate-600 font-semibold">No buyer offers received for this trade lot yet.</p>
                      <p className="text-[11px] text-slate-400">As commercial buyers submit purchase bids, they will appear here in real time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {offers.map((offer, idx) => {
                      const offerKey = offer.offerId || offer._id;
                      const isAccepted = acceptedOfferId === offerKey || offer.offerStatus === 'ACCEPTED';
                      const isRejected = rejectedOfferIds[offerKey] || (acceptedOfferId && !isAccepted) || offer.offerStatus === 'REJECTED';
                      const isCountered = offer.offerStatus === 'COUNTERED';
                      const isAwaitingBuyer = isCountered && (offer.counterBy === 'FARMER' || (!offer.counterBy && Boolean(offer.counterPricePerQtl)));
                      const isCounteredByBuyer = isCountered && offer.counterBy === 'BUYER';

                      return (
                        <div
                          key={offerKey}
                          className={`rounded-xl border p-4 space-y-4 transition-all flex flex-col justify-between ${
                            isAccepted
                              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                              : isRejected
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : isAwaitingBuyer
                              ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          {/* Offer Header */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                                  {offer.buyer?.businessName || `Buyer Offer ${idx + 1}`}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {offer.buyer?.buyerType || 'Commercial Buyer'} • {offer.buyer?.district || 'Nashik'}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                isAccepted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isRejected
                                  ? 'bg-slate-200 text-slate-600 border-slate-300'
                                  : isAwaitingBuyer
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : isCounteredByBuyer
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {isAccepted
                                  ? 'ACCEPTED'
                                  : isRejected
                                  ? 'REJECTED'
                                  : isAwaitingBuyer
                                  ? 'AWAITING BUYER'
                                  : isCounteredByBuyer
                                  ? 'BUYER COUNTERED'
                                  : 'PENDING'}
                              </span>
                            </div>

                            {/* Price & Net Realization Breakdown */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium">
                                  {isAwaitingBuyer ? 'Counter Price:' : 'Offered Price:'}
                                </span>
                                <strong className="text-slate-900 font-extrabold text-sm">
                                  ₹{(isAwaitingBuyer && offer.counterPricePerQtl ? offer.counterPricePerQtl : offer.pricePerQtl).toLocaleString('en-IN')}/Qtl
                                </strong>
                              </div>
                              {isAwaitingBuyer && (
                                <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold bg-amber-50 p-1.5 rounded border border-amber-200">
                                  <span>Original Bid: ₹{offer.pricePerQtl}/Qtl</span>
                                  <span>Counter: ₹{offer.counterPricePerQtl}/Qtl</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Gross Value ({offer.quantityQtl} Qtl):</span>
                                <span>₹{offer.grossValue.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-rose-600">
                                <span>Freight & Handling:</span>
                                <span>-₹{(offer.estimatedTransportCost + offer.estimatedMarketHandlingCharges + offer.estimatedSpoilage).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-800">Est. Net Take-Home:</span>
                                <strong className="text-emerald-700 font-black text-base">
                                  ₹{offer.estimatedNetRealization.toLocaleString('en-IN')}
                                </strong>
                              </div>
                            </div>

                            {/* Terms */}
                            <div className="space-y-1 text-[11px] text-slate-600 font-medium pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Payment Terms:</span>
                                <span className="font-bold text-slate-700">{offer.paymentTerms}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Delivery Terms:</span>
                                <span className="font-bold text-slate-700">{offer.deliveryLocation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                            {isAccepted ? (
                              <div className="w-full py-2 px-3 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Deal Confirmed & Accepted
                              </div>
                            ) : isRejected ? (
                              <div className="w-full py-2 px-3 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium text-center">
                                Offer Declined
                              </div>
                            ) : isAwaitingBuyer ? (
                              /* Farmer waiting for Buyer: DO NOT show Accept/Reject. Show View in Matrix / Awaiting Buyer Response */
                              <div className="w-full flex items-center justify-between gap-2">
                                <button
                                  onClick={() => setSelectedLotForModal(lot)}
                                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all text-center flex-1 cursor-pointer"
                                >
                                  View Counter
                                </button>
                                <span className="py-2 px-3 rounded-lg bg-amber-100 text-amber-950 font-bold text-xs text-center border border-amber-300 flex-1">
                                  Awaiting Buyer
                                </span>
                              </div>
                            ) : isCounteredByBuyer ? (
                              /* Buyer Countered: Farmer can accept or counter */
                              <>
                                <button
                                  onClick={() => setSelectedLotForModal(lot)}
                                  className="flex-1 py-2 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
                                >
                                  Counter Again
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(offerKey)}
                                  className="py-2 px-2.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-all text-center cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAcceptOffer(offer, lot)}
                                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all text-center cursor-pointer"
                                >
                                  Accept Counter →
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedLotForModal(lot)}
                                  className="flex-1 py-2 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
                                >
                                  Compare
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(offerKey)}
                                  className="py-2 px-2.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-all text-center cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAcceptOffer(offer, lot)}
                                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all text-center cursor-pointer"
                                >
                                  Accept Offer →
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offer Comparison Modal */}
      {selectedLotForModal && (
        <OfferComparisonModal
          lot={selectedLotForModal}
          isOpen={!!selectedLotForModal}
          onClose={() => setSelectedLotForModal(null)}
          onOfferAccepted={() => {
            loadData();
            setSelectedLotForModal(null);
          }}
          lang={lang}
        />
      )}

      {/* Deal Confirmed Modal */}
      {dealConfirmedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                {lang === 'mr' ? 'सौदा यशस्वीरित्या निश्चित झाला!' : 'Deal Confirmed Successfully!'}
              </h3>
              <p className="text-xs text-slate-600">
                {lang === 'mr'
                  ? 'वितरण ऑर्डर व पेमेंट रेकॉर्ड स्वयंचलितपणे तयार झाले आहेत.'
                  : 'Delivery order and payment ledger records have been generated.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer:</span>
                <strong className="text-slate-900">{dealConfirmedModal.offer.buyer?.businessName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crop Lot:</span>
                <strong className="text-slate-900">{dealConfirmedModal.lot.cropName} ({dealConfirmedModal.lot.lotId})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agreed Price:</span>
                <strong className="text-emerald-700">₹{dealConfirmedModal.offer.pricePerQtl.toLocaleString('en-IN')}/Qtl</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Take-Home:</span>
                <strong className="text-emerald-700 font-extrabold">₹{dealConfirmedModal.offer.estimatedNetRealization.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <button
              onClick={() => setDealConfirmedModal(null)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Continue to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
