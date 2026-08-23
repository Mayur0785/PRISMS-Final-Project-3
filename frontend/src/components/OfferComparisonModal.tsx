import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, Sparkles, Building2, Layers, Check, Info, Truck, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { TradeLot, Offer, fetchOffersForLot, acceptOfferApi, rejectOfferApi, counterOfferApi, recordOfferAcceptance, getAcceptedOfferForLot } from '../lib/prisms';

interface OfferComparisonModalProps {
  lot: TradeLot;
  isOpen: boolean;
  onClose: () => void;
  onOfferAccepted?: () => void;
  lang?: "en" | "mr";
}

/** Generates realistic demo sandbox buyer offers when backend has no active seeded offers */
export const generateDemoOffers = (tradeLot: TradeLot): (Offer & { isDemo?: boolean })[] => {
  const basePrice = tradeLot.expectedPricePerQtl || 3200;
  const qty = tradeLot.quantityQtl || 25;
  const crop = tradeLot.cropName || 'Crop';

  // Demo Offer 1: Nashik Agro Processors Ltd. (Highest Net - Buyer Pickup)
  const price1 = Math.round(basePrice * 1.03);
  const gross1 = Math.round(price1 * qty);
  const transport1 = 0; // Buyer pickup = 0 transport cost for farmer
  const handling1 = Math.round(gross1 * 0.005);
  const spoilage1 = Math.round(gross1 * 0.015);
  const net1 = gross1 - transport1 - handling1 - spoilage1;

  // Demo Offer 2: Pune Fresh Foods Pvt Ltd (Wholesaler - Farmer Delivery)
  const price2 = Math.round(basePrice * 0.98);
  const gross2 = Math.round(price2 * qty);
  const transport2 = Math.round(qty * 45); // Farmer delivery transport cost
  const handling2 = Math.round(gross2 * 0.005);
  const spoilage2 = Math.round(gross2 * 0.015);
  const net2 = gross2 - transport2 - handling2 - spoilage2;

  // Demo Offer 3: Sahyadri Farmers Producer Co. (FPO Aggregator)
  const price3 = Math.round(basePrice * 1.01);
  const gross3 = Math.round(price3 * qty);
  const transport3 = Math.round(qty * 25);
  const handling3 = Math.round(gross3 * 0.005);
  const spoilage3 = Math.round(gross3 * 0.01);
  const net3 = gross3 - transport3 - handling3 - spoilage3;

  return [
    {
      _id: `demo_off_1_${tradeLot._id || '01'}`,
      offerId: `DEMO-OFF-001`,
      lotId: tradeLot._id,
      buyerId: `DEMO-BUYER-01`,
      sellerUserId: tradeLot.userId || 'demo_user',
      commodity: crop,
      variety: tradeLot.variety || 'Standard',
      grade: tradeLot.grade || 'Grade A',
      quantityQtl: qty,
      pricePerQtl: price1,
      grossValue: gross1,
      estimatedTransportCost: transport1,
      estimatedMarketHandlingCharges: handling1,
      estimatedSpoilage: spoilage1,
      estimatedNetRealization: net1,
      paymentTerms: 'Payment within 48 hours (Bank Transfer)',
      deliveryLocation: 'Buyer Pickup (Self Logistics)',
      offerStatus: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
      buyer: {
        buyerId: 'DEMO-BUYER-01',
        businessName: 'Nashik Agro Processors Ltd.',
        buyerType: 'Processor',
        district: 'Nashik',
        rating: 4.8,
      },
    },
    {
      _id: `demo_off_2_${tradeLot._id || '02'}`,
      offerId: `DEMO-OFF-002`,
      lotId: tradeLot._id,
      buyerId: `DEMO-BUYER-02`,
      sellerUserId: tradeLot.userId || 'demo_user',
      commodity: crop,
      variety: tradeLot.variety || 'Standard',
      grade: tradeLot.grade || 'Grade A',
      quantityQtl: qty,
      pricePerQtl: price2,
      grossValue: gross2,
      estimatedTransportCost: transport2,
      estimatedMarketHandlingCharges: handling2,
      estimatedSpoilage: spoilage2,
      estimatedNetRealization: net2,
      paymentTerms: 'Payment within 24 hours (Direct Deposit)',
      deliveryLocation: 'Farmer Delivery to Hub',
      offerStatus: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
      buyer: {
        buyerId: 'DEMO-BUYER-02',
        businessName: 'Pune Fresh Foods Pvt Ltd',
        buyerType: 'Wholesaler',
        district: 'Pune',
        rating: 4.6,
      },
    },
    {
      _id: `demo_off_3_${tradeLot._id || '03'}`,
      offerId: `DEMO-OFF-003`,
      lotId: tradeLot._id,
      buyerId: `DEMO-BUYER-03`,
      sellerUserId: tradeLot.userId || 'demo_user',
      commodity: crop,
      variety: tradeLot.variety || 'Standard',
      grade: tradeLot.grade || 'Grade A',
      quantityQtl: qty,
      pricePerQtl: price3,
      grossValue: gross3,
      estimatedTransportCost: transport3,
      estimatedMarketHandlingCharges: handling3,
      estimatedSpoilage: spoilage3,
      estimatedNetRealization: net3,
      paymentTerms: 'Immediate Payment upon Quality Check',
      deliveryLocation: 'APMC Yard Collection Point',
      offerStatus: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
      buyer: {
        buyerId: 'DEMO-BUYER-03',
        businessName: 'Sahyadri Farmers Producer Co.',
        buyerType: 'FPO Aggregator',
        district: 'Nashik',
        rating: 4.9,
      },
    },
  ];
};

export const OfferComparisonModal: React.FC<OfferComparisonModalProps> = ({
  lot,
  isOpen,
  onClose,
  onOfferAccepted,
  lang = "en",
}) => {
  const [offers, setOffers] = useState<(Offer & { isDemo?: boolean })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(lot?.expectedPricePerQtl || 0);
  const [counterNote, setCounterNote] = useState<string>('');
  const [viewMode, setViewMode] = useState<"cards" | "compare">("cards");
  const [mounted, setMounted] = useState<boolean>(false);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll behind modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && lot) {
      loadOffers();
    }
  }, [isOpen, lot]);

  const loadOffers = async () => {
    setLoading(true);
    setErrorState(null);
    let data: (Offer & { isDemo?: boolean })[] = [];
    let fetchError = false;

    try {
      // Timeout safety (8 seconds) to prevent infinite pending state
      const fetchPromise = fetchOffersForLot(lot._id || lot.lotId);
      const timeoutPromise = new Promise<Offer[]>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 8000)
      );
      data = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn("API offer fetch failed or timed out", err);
      fetchError = true;
    }

    try {
      if (!data || data.length === 0) {
        data = generateDemoOffers(lot);
      }
    } catch (genErr) {
      console.error("Demo offer generation failed", genErr);
    }

    if (!data || data.length === 0) {
      if (fetchError) {
        setErrorState(lang === "mr" ? "खरेदीदार ऑफर्स लोड करण्यात अक्षम." : "Unable to load buyer offers.");
      } else {
        setOffers([]);
      }
      setLoading(false);
      return;
    }

    try {
      // Persisted accepted check
      const persistedAcceptedId = getAcceptedOfferForLot(lot._id) || getAcceptedOfferForLot(lot.lotId);
      const existingAccepted = data.find(o => o.offerStatus === 'ACCEPTED');
      const isLotAccepted = (lot.lotStatus === 'ACCEPTED' || Boolean(persistedAcceptedId) || Boolean(existingAccepted)) && Boolean(persistedAcceptedId || existingAccepted);

      if (isLotAccepted) {
        const targetId = persistedAcceptedId || existingAccepted?._id || existingAccepted?.offerId;
        if (targetId) {
          data = data.map((o) => {
            const isThisAccepted = (o._id === targetId || o.offerId === targetId);
            return {
              ...o,
              offerStatus: isThisAccepted ? 'ACCEPTED' : 'REJECTED',
            };
          });
        }
      }

      // Sort: Keep ACCEPTED at top, rest sorted by estimatedNetRealization descending
      data.sort((a, b) => {
        if (a.offerStatus === 'ACCEPTED') return -1;
        if (b.offerStatus === 'ACCEPTED') return 1;
        return (b.estimatedNetRealization || 0) - (a.estimatedNetRealization || 0);
      });

      setOffers(data);
    } catch (err) {
      console.error("Error sorting offer list", err);
      setOffers(data);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lot || !mounted) return null;

  const handleAccept = async (offerId: string) => {
    if (acceptingOfferId) return; // Prevent rapid duplicate calls

    const targetOffer = offers.find(o => o.offerId === offerId || o._id === offerId);
    if (!targetOffer) return;

    // Check if lot already has an accepted offer
    const hasExistingAccepted = offers.some(o => o.offerStatus === 'ACCEPTED') || lot.lotStatus === 'ACCEPTED' || Boolean(getAcceptedOfferForLot(lot._id) || getAcceptedOfferForLot(lot.lotId));
    if (hasExistingAccepted) return;

    setAcceptingOfferId(offerId);
    setActionMessage(lang === "mr" ? "स्वीकृती प्रक्रिया सुरू आहे..." : "Accepting offer...");

    // Record acceptance & create delivery, payment, transaction demo records (Idempotent)
    recordOfferAcceptance(targetOffer, lot);

    // Update lot status
    lot.lotStatus = 'ACCEPTED';

    if (targetOffer.isDemo || offerId.startsWith("DEMO-")) {
      // Mark accepted offer as ACCEPTED, and all other competing offers for this lot as REJECTED
      setOffers(prev =>
        prev.map(o =>
          o.offerId === offerId || o._id === offerId
            ? { ...o, offerStatus: 'ACCEPTED' }
            : { ...o, offerStatus: 'REJECTED' }
        )
      );
      setActionMessage(
        lang === "mr"
          ? "डेमो सौदा निश्चित झाला! वितरण आणि पेमेंट ट्रॅकिंग सुरू झाले."
          : "Deal Confirmed! Demo delivery and payment records initiated."
      );
      if (onOfferAccepted) {
        setTimeout(() => onOfferAccepted(), 500);
      }
    } else {
      try {
        await acceptOfferApi(offerId);
        setOffers(prev =>
          prev.map(o =>
            o.offerId === offerId || o._id === offerId
              ? { ...o, offerStatus: 'ACCEPTED' }
              : { ...o, offerStatus: 'REJECTED' }
          )
        );
        setActionMessage(
          lang === "mr"
            ? "सौदा निश्चित झाला! वितरण ट्रॅकिंग सुरू झाले."
            : "Deal Confirmed! Delivery and payment tracking initiated."
        );
        if (onOfferAccepted) onOfferAccepted();
      } catch {
        setOffers(prev =>
          prev.map(o =>
            o.offerId === offerId || o._id === offerId
              ? { ...o, offerStatus: 'ACCEPTED' }
              : { ...o, offerStatus: 'REJECTED' }
          )
        );
        setActionMessage(
          lang === "mr"
            ? "डेमो सौदा निश्चित झाला! वितरण ट्रॅकिंग सुरू झाले."
            : "Deal Confirmed! Demo delivery tracking initiated."
        );
        if (onOfferAccepted) onOfferAccepted();
      }
    }
    setAcceptingOfferId(null);
  };

  const handleReject = async (offerId: string) => {
    const targetOffer = offers.find(o => o.offerId === offerId || o._id === offerId);
    if (targetOffer?.isDemo || offerId.startsWith("DEMO-")) {
      setOffers(prev =>
        prev.map(o => (o.offerId === offerId || o._id === offerId ? { ...o, offerStatus: 'REJECTED' } : o))
      );
      setActionMessage(lang === "mr" ? "डेमो ऑफर नाकारली." : "Demo offer rejected.");
    } else {
      try {
        await rejectOfferApi(offerId);
        setOffers(prev =>
          prev.map(o => (o.offerId === offerId || o._id === offerId ? { ...o, offerStatus: 'REJECTED' } : o))
        );
        setActionMessage(lang === "mr" ? "ऑफर नाकारली." : "Offer rejected.");
      } catch {
        setOffers(prev =>
          prev.map(o => (o.offerId === offerId || o._id === offerId ? { ...o, offerStatus: 'REJECTED' } : o))
        );
        setActionMessage(lang === "mr" ? "डेमो ऑफर नाकारली." : "Demo offer rejected.");
      }
    }
  };

  const handleCounterSubmit = async (offerId: string) => {
    try {
      await counterOfferApi(offerId, counterPrice, counterNote);
      setCounteringOfferId(null);
      setOffers(prev =>
        prev.map(o => (o.offerId === offerId || o._id === offerId ? { ...o, offerStatus: 'COUNTERED' } : o))
      );
      setActionMessage(lang === "mr" ? "काउंटर ऑफर सबमिट केली." : "Counter offer submitted successfully.");
    } catch {
      setCounteringOfferId(null);
      setOffers(prev =>
        prev.map(o => (o.offerId === offerId || o._id === offerId ? { ...o, offerStatus: 'COUNTERED' } : o))
      );
      setActionMessage(lang === "mr" ? "डेमो काउंटर ऑफर सबमिट केली." : "Demo counter offer submitted.");
    }
  };

  // Best offer is ranked #1 by highest estimatedNetRealization
  const bestOffer = offers.length > 0 ? offers[0] : null;

  const modalMarkup = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Full-Viewport Dark Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Centered Top-Level Modal Container */}
      <div className="relative z-[100000] bg-white border border-slate-200 rounded-2xl w-[92vw] max-w-[1200px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900">
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 truncate">
                  {lang === "mr" ? "डिजिटल खरेदीदार ऑफर्स आणि निव्वळ परतावा तुलना" : "Digital Buyer Offers & Net Comparison"}
                </h2>
                <span className="px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Demo Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 truncate">
                Lot {lot.lotId}: <strong className="text-slate-900">{lot.cropName}</strong> ({lot.quantityQtl} Qtl) • {lang === "mr" ? "अपेक्षित भाव:" : "Expected:"} ₹{lot.expectedPricePerQtl.toLocaleString('en-IN')}/Qtl • {lang === "mr" ? "उगम:" : "Origin:"} {lot.origin || lot.district || 'Farm Gate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === "cards" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {lang === "mr" ? "ऑफर कार्ड्स" : "Offer Cards"}
              </button>
              <button
                onClick={() => setViewMode("compare")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  viewMode === "compare" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {lang === "mr" ? "तुलना तक्ता" : "Compare"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Notice Banner */}
        <div className="px-4 sm:px-6 pt-3 pb-0 shrink-0">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-700" />
            <span className="leading-snug">
              {lang === "mr"
                ? "डेमो सँडबॉक्स: या खरेदीदार ऑफर्स प्रात्यक्षिकासाठी सादर केल्या आहेत. प्रत्यक्ष बँक व्यवहार किंवा वाहतूक प्रक्रिया सुरू होत नाही."
                : "Demo Sandbox: These buyer offers are simulated presentation models for demonstration. No real financial debit, bank transfer, or transport dispatch is initiated."}
            </span>
          </div>
        </div>

        {actionMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shrink-0 shadow-sm">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50">
          {loading ? (
            <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">{lang === "mr" ? "डिजिटल खरेदीदार ऑफर्स लोड करत आहे..." : "Loading digital buyer offers..."}</span>
            </div>
          ) : errorState ? (
            <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-1" />
              <h3 className="text-base font-bold text-slate-800">{errorState}</h3>
              <p className="text-xs text-slate-500 max-w-md">
                {lang === "mr" ? "नेटवर्क त्रुटी किंवा सर्व्हर समस्या निर्माण झाली आहे." : "A network error or server timeout occurred while fetching buyer offers."}
              </p>
              <button
                onClick={() => loadOffers()}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "mr" ? "पुन्हा प्रयत्न करा" : "Retry"}
              </button>
            </div>
          ) : offers.length === 0 ? (
            <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <Building2 className="w-10 h-10 text-slate-400 mb-2" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === "mr" ? "कोणतीही सक्रिय खरेदीदार ऑफर आढळली नाही." : "No active buyer offers found."}
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                {lang === "mr"
                  ? "या शेतमाल लॉटसाठी सध्या कोणत्याही खरेदीदाराकडून मागणी प्राप्त झालेली नाही."
                  : "No buyer bids have been received for this trade lot yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Best Offer Banner */}
              {bestOffer && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 animate-pulse" />
                      <span>
                        {lang === "mr"
                          ? "#१ शिफारस केलेली ऑफर (उच्चतम निव्वळ परतावा)"
                          : "BEST OFFER — Highest Take-Home Net Realization"}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ₹{(bestOffer.estimatedNetRealization || 0).toLocaleString('en-IN')} {lang === "mr" ? "निव्वळ हाती येणारी रक्कम" : "Est. Net Take-Home"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    {lang === "mr"
                      ? `${bestOffer.buyer?.businessName || bestOffer.buyerId} कडून आलेली ही ऑफर वाहतूक, हमाली व हानी वजा करून सर्वात जास्त निव्वळ परतावा (₹${(bestOffer.estimatedNetRealization || 0).toLocaleString('en-IN')}) देते.`
                      : `Offer from ${bestOffer.buyer?.businessName || bestOffer.buyerId} yields the highest net take-home (₹${(bestOffer.estimatedNetRealization || 0).toLocaleString('en-IN')}) after accounting for logistics freight, handling, and spoilage deductions.`}
                  </p>
                </div>
              )}

              {/* View Mode 1: Offer Cards */}
              {viewMode === "cards" ? (
                <div className="space-y-4">
                  {(() => {
                    const hasAcceptedOffer = offers.some(o => o.offerStatus === 'ACCEPTED') || lot?.lotStatus === 'ACCEPTED' || Boolean(getAcceptedOfferForLot(lot._id) || getAcceptedOfferForLot(lot.lotId));

                    return offers.map((off, idx) => {
                      const isBest = idx === 0;
                      const isAccepted = off.offerStatus === 'ACCEPTED';
                      const isRejected = off.offerStatus === 'REJECTED' || (hasAcceptedOffer && !isAccepted);

                      return (
                        <div
                          key={off._id || off.offerId}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                            isAccepted
                              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                              : isRejected
                              ? 'bg-slate-100 border-slate-200 opacity-60'
                              : isBest
                              ? 'bg-white border-emerald-500/50 shadow-md ring-1 ring-emerald-200'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          {/* Offer Header Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-900 text-base">
                                  {off.buyer?.businessName || off.buyerId}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  Demo Offer
                                </span>
                                {isBest && !isAccepted && !isRejected && (
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-600" /> BEST OFFER
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    isAccepted
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isRejected
                                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isAccepted
                                    ? (lang === "mr" ? "स्वीकृत" : "ACCEPTED")
                                    : isRejected
                                    ? (lang === "mr" ? "नाकारले" : "REJECTED")
                                    : (lang === "mr" ? "प्रलंबित" : "PENDING")}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-medium">
                                <span>{off.buyer?.buyerType || 'Verified Buyer'}</span>
                                <span>•</span>
                                <span>{off.buyer?.district || 'Hub'}</span>
                                <span>•</span>
                                <span className="text-amber-700 font-bold">★ {off.buyer?.rating || 4.8}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                {lang === "mr" ? "ऑफर दर" : "Offered Price"}
                              </span>
                              <span className="text-lg font-black text-slate-900">
                                ₹{off.pricePerQtl.toLocaleString('en-IN')}
                                <span className="text-xs font-normal text-slate-500"> /Qtl</span>
                              </span>
                            </div>
                          </div>

                          {/* Net Waterfall Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">{lang === "mr" ? "एकूण मूल्य" : "Gross Value"}</span>
                              <span className="font-bold text-slate-800">₹{off.grossValue.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">{lang === "mr" ? "वाहतूक भाडे" : "Transit Freight"}</span>
                              <span className="font-medium text-rose-700">− ₹{off.estimatedTransportCost.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">{lang === "mr" ? "हमाली व हानी कपात" : "Handling & Spoilage"}</span>
                              <span className="font-medium text-rose-700">− ₹{(off.estimatedMarketHandlingCharges + off.estimatedSpoilage).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bg-emerald-100/60 p-1.5 rounded-lg border border-emerald-300 text-center">
                              <span className="text-[10px] text-emerald-800 font-extrabold block uppercase tracking-wide">{lang === "mr" ? "निव्वळ हाती" : "Est. Net Take-Home"}</span>
                              <span className="font-black text-emerald-700 text-sm">₹{off.estimatedNetRealization.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Terms & Delivery */}
                          <div className="text-xs space-y-1 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-medium">
                            <div><strong>{lang === "mr" ? "पेमेंट अटी:" : "Payment Terms:"}</strong> {off.paymentTerms}</div>
                            <div><strong>{lang === "mr" ? "वितरण ठिकाण:" : "Delivery Terms:"}</strong> {off.deliveryLocation}</div>
                          </div>

                          {/* Counter Offer Box */}
                          {counteringOfferId === off._id && !isAccepted && !isRejected && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
                              <h4 className="text-xs font-bold text-amber-900">
                                {lang === "mr" ? "काउंटर ऑफर प्रस्तावित करा" : "Propose Counter Offer"}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                <input
                                  type="number"
                                  value={counterPrice}
                                  onChange={e => setCounterPrice(Number(e.target.value))}
                                  placeholder="Counter Price / Qtl"
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-amber-500 w-36 font-semibold"
                                />
                                <input
                                  type="text"
                                  value={counterNote}
                                  onChange={e => setCounterNote(e.target.value)}
                                  placeholder="Note for buyer (optional)"
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-amber-500 flex-1 font-medium"
                                />
                                <button
                                  onClick={() => handleCounterSubmit(off.offerId)}
                                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm"
                                >
                                  {lang === "mr" ? "सबमिट करा" : "Submit Counter"}
                                </button>
                                <button
                                  onClick={() => setCounteringOfferId(null)}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                                >
                                  {lang === "mr" ? "रद्द करा" : "Cancel"}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Card Footer Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                              {lang === "mr" ? "मुदत:" : "Expires:"} {new Date(off.expiresAt).toLocaleDateString()}
                            </div>

                            {!isAccepted && !isRejected ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => setViewMode("compare")}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-all flex items-center gap-1"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  {lang === "mr" ? "तुलना करा" : "Compare"}
                                </button>

                                <button
                                  onClick={() => setCounteringOfferId(off._id)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold border border-amber-300 transition-all shadow-sm"
                                >
                                  {lang === "mr" ? "काउंटर ऑफर" : "Counter Offer"}
                                </button>

                                <button
                                  onClick={() => handleReject(off.offerId)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-all shadow-sm"
                                >
                                  {lang === "mr" ? "नाकारा" : "Reject"}
                                </button>

                                <button
                                  onClick={() => handleAccept(off.offerId)}
                                  disabled={Boolean(acceptingOfferId)}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                                >
                                  {lang === "mr" ? "ऑफर स्वीकारा" : "Accept Offer"}
                                </button>
                              </div>
                            ) : isAccepted ? (
                              <div className="w-full space-y-3 pt-2">
                                {/* Deal Confirmed Card */}
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                      {lang === "mr" ? "सौदा निश्चित (Deal Confirmed)" : "✅ Deal Confirmed"}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-300">
                                      Status: ACCEPTED
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-800 font-medium bg-white p-3 rounded-lg border border-emerald-200 shadow-xs my-2">
                                    <div><strong>Buyer:</strong> {off.buyer?.businessName || off.buyerId}</div>
                                    <div><strong>Lot:</strong> {lot.lotId || lot._id}</div>
                                    <div><strong>Agreed Price:</strong> ₹{off.pricePerQtl.toLocaleString('en-IN')}/Qtl</div>
                                    <div><strong>Estimated Net Take-Home:</strong> <span className="text-emerald-700 font-bold">₹{off.estimatedNetRealization.toLocaleString('en-IN')}</span></div>
                                  </div>

                                  <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                                    {lang === "mr"
                                      ? "डेमो व्यवहार — वास्तविक पेमेंट किंवा वाहतूक प्रक्रिया सुरू होत नाही."
                                      : "Demo Transaction — No real payment or delivery is initiated."}
                                  </div>
                                </div>

                                {/* Post-Acceptance Action Buttons */}
                                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      onClose();
                                      window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "delivery" }));
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    {lang === "mr" ? "वितरण ट्रॅक करा" : "Track Delivery"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      onClose();
                                      window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "payments" }));
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {lang === "mr" ? "पेमेंट पहा" : "View Payment"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      onClose();
                                      window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "transactions" }));
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center gap-1.5"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    {lang === "mr" ? "व्यवहार इतिहास" : "View Transaction"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-rose-800 font-bold bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                                {lang === "mr" ? "नाकारलेली / बंद ऑफर" : "Demo Offer Closed"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* View Mode 2: Side-by-Side Comparison Table */
                <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                        <th className="p-3.5 font-bold w-1/4">{lang === "mr" ? "ऑफर मापदंड" : "Offer Parameter"}</th>
                        {offers.map((off, idx) => (
                          <th key={off.offerId} className="p-3.5 font-bold text-center border-l border-slate-200">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm text-slate-900">{off.buyer?.businessName || off.buyerId}</span>
                              {idx === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                                  ★ BEST OFFER
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr>
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "किंमत प्रति क्विंटल" : "Quoted Price / Qtl"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center font-bold text-emerald-700 text-sm border-l border-slate-200">
                            ₹{off.pricePerQtl.toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "ऑफर केलेले प्रमाण" : "Offered Quantity"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center font-medium border-l border-slate-200">
                            {off.quantityQtl} Qtl (Gross ₹{off.grossValue.toLocaleString('en-IN')})
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "वाहतूक निवड" : "Delivery Preference"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center border-l border-slate-200">
                            {off.deliveryLocation}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "पेमेंट अटी" : "Payment Terms"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center border-l border-slate-200">
                            {off.paymentTerms}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "वाहतूक भाडे खर्च" : "Logistics Freight"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center border-l border-slate-200">
                            ₹{off.estimatedTransportCost.toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "हमाली व हानी कपात" : "Handling & Spoilage"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center border-l border-slate-200">
                            ₹{(off.estimatedMarketHandlingCharges + off.estimatedSpoilage).toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                        <td className="p-3.5 text-emerald-800 text-sm">{lang === "mr" ? "निव्वळ हाती येणारी रक्कम" : "Est. Net Realization"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center text-emerald-700 text-base border-l border-slate-200 font-extrabold">
                            ₹{off.estimatedNetRealization.toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3.5 font-semibold text-slate-600">{lang === "mr" ? "कृती" : "Action"}</td>
                        {offers.map(off => (
                          <td key={off.offerId} className="p-3.5 text-center border-l border-slate-200">
                            {off.offerStatus === 'ACCEPTED' ? (
                              <span className="text-emerald-700 font-bold text-xs">{lang === "mr" ? "स्वीकृत" : "Accepted"}</span>
                            ) : off.offerStatus === 'REJECTED' ? (
                              <span className="text-rose-700 font-semibold text-xs">{lang === "mr" ? "नाकारले" : "Rejected"}</span>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleReject(off.offerId)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-bold hover:bg-rose-100 border border-rose-200"
                                >
                                  {lang === "mr" ? "नाकारा" : "Reject"}
                                </button>
                                <button
                                  onClick={() => handleAccept(off.offerId)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                                >
                                  {lang === "mr" ? "स्वीकारा" : "Accept"}
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};
