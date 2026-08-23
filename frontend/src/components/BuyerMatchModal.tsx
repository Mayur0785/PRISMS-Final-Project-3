import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchLotMatches, type ComparativeDecision, type TradeLot } from "@/lib/prisms";
import { X, CheckCircle2, AlertTriangle, Building2, Store, Tag, Sparkles, TrendingUp, Search } from "lucide-react";
import { OfferComparisonModal } from "./OfferComparisonModal";

interface BuyerMatchModalProps {
  lot: TradeLot;
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "mr";
}

export function BuyerMatchModal({ lot, isOpen, onClose, lang }: BuyerMatchModalProps) {
  const [decision, setDecision] = useState<ComparativeDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [showRankedList, setShowRankedList] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll behind modal when open (matches Digital Buyer Offers modal)
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
      setLoading(true);
      setShowRankedList(false);
      fetchLotMatches(lot.lotId || lot._id, lot).then((res) => {
        setDecision(res);
        setLoading(false);
      });
    }
  }, [isOpen, lot]);

  if (!isOpen || !lot || !mounted) return null;

  const buyerNet = decision?.bestBuyerMatch?.estimatedNetRealization || 0;
  const mandiNet = decision?.bestMandi?.estimatedNetRealization || 0;
  const hasMandi = Boolean(decision?.bestMandi && mandiNet > 0);

  let isBuyerWinner = true;
  let isMandiWinner = false;

  if (hasMandi) {
    if (mandiNet > buyerNet) {
      isMandiWinner = true;
      isBuyerWinner = false;
    }
  }

  const diff = Math.abs(buyerNet - mandiNet);
  const isClose = hasMandi && diff < 200;

  const modalMarkup = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Full-Viewport Dark Backdrop with Blur (Matches Digital Buyer Offers Modal) */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Centered Sharp Modal Container (z-[100000] above backdrop) */}
      <div className="relative z-[100000] bg-white border border-slate-200 rounded-2xl w-[92vw] max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900">
        {/* Fixed Header (Matches Digital Buyer Offers Modal Header Structure) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0 z-10 sticky top-0 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              {/* ROW 1: Main Title */}
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 truncate">
                {lang === "mr" ? `व्यापारी मॅच व तुलनात्मक नफा (${lot.cropName})` : `Buyer Match & Realization Support (${lot.cropName})`}
              </h2>
              {/* ROW 2: Lot Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mt-0.5 font-medium">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px] px-2 py-0.2 rounded">
                  {lot.lotId}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-800">{lot.quantityQtl} Qtl</span>
                <span>•</span>
                <span>{lot.grade}</span>
                <span>•</span>
                <span>{lot.origin || "Farm Gate"}</span>
              </div>
            </div>
          </div>

          {/* Close Button Top-Right Aligned */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
            title={lang === "mr" ? "बंद करा" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 bg-slate-50 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-600">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3" />
              <p>{lang === "mr" ? "मॅचिंग इंजिन गणना करत आहे..." : "Running deterministic buyer matching engine..."}</p>
            </div>
          ) : !decision ? (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600">{lang === "mr" ? "कोणतीही मॅच माहिती मिळाली नाही." : "No nearby market data available."}</p>
            </div>
          ) : (
            <>
              {/* Single Clear Recommendation Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {lang === "mr" ? "सर्वोत्तम विक्री पर्याय" : "BEST SELLING OPTION"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isBuyerWinner
                      ? (lang === "mr" ? "शिफारस: थेट खरेदीदार" : "Recommended: Direct Buyer")
                      : (lang === "mr" ? "शिफारस: APMC बाजार समिती" : "Recommended: APMC Mandi")}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {isBuyerWinner
                    ? (lang === "mr" ? "थेट खरेदीदार विक्री शिफारस" : "Direct Buyer Sale Recommended")
                    : (lang === "mr" ? "APMC बाजार समिती लिलाव शिफारस" : "APMC Mandi Auction Recommended")}
                </h3>

                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  {!hasMandi
                    ? (lang === "mr"
                        ? "या पिकासाठी जुळणारा APMC बेंचमार्क उपलब्ध नसल्यामुळे थेट खरेदीदार हा मूल्यांकित विक्री पर्याय आहे."
                        : "Direct buyer is the available evaluated selling option as no matching APMC benchmark is currently available for this crop.")
                    : isClose
                    ? (lang === "mr" ? "दोन्ही पर्याय आर्थिकदृष्ट्या समान आहेत." : "Both options are financially similar.")
                    : isBuyerWinner
                    ? (lang === "mr"
                        ? `अंदाजित निव्वळ परतावा APMC बाजारापेक्षा ₹${diff.toLocaleString("en-IN")} जास्त आहे.`
                        : `Estimated net take-home is ₹${diff.toLocaleString("en-IN")} higher than the APMC Mandi option.`)
                    : (lang === "mr"
                        ? `अंदाजित निव्वळ परतावा थेट खरेदीदारापेक्षा ₹${diff.toLocaleString("en-IN")} जास्त आहे.`
                        : `Estimated net take-home is ₹${diff.toLocaleString("en-IN")} higher than the direct buyer option.`)}
                </p>
              </div>

              {/* Comparison Cards: Card 1 (Direct Buyer) vs Card 2 (Best APMC Mandi) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CARD 1: DIRECT BUYER */}
                {decision.bestBuyerMatch ? (
                  <div className={`bg-white rounded-2xl border ${
                    isBuyerWinner ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                  } p-5 flex flex-col justify-between shadow-sm relative overflow-hidden`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                          isBuyerWinner
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {isBuyerWinner ? "RECOMMENDED" : "ALTERNATIVE"}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                          DEMO BUYER
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        {decision.bestBuyerMatch.buyer.businessName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">{decision.bestBuyerMatch.buyer.buyerType} • {decision.bestBuyerMatch.buyer.district}</p>

                      <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "मॅच स्कोअर:" : "Match Score:"}</span>
                          <span className="font-bold text-emerald-700">{decision.bestBuyerMatch.matchScore}% Match</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "लक्ष्य दर (Quoted):" : "Quoted Price:"}</span>
                          <span className="font-bold text-slate-900">₹{decision.bestBuyerMatch.quotedPricePerQtl.toLocaleString("en-IN")}/Qtl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "एकूण उत्पन्न (Gross):" : "Gross Revenue:"}</span>
                          <span className="text-slate-900 font-semibold">₹{decision.bestBuyerMatch.grossRevenue.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "वाहतूक व हाताळणी:" : "Logistics / Spoilage:"}</span>
                          <span className="text-rose-700 font-bold">-₹{(decision.bestBuyerMatch.estimatedTransportCost + decision.bestBuyerMatch.estimatedHandlingFee + decision.bestBuyerMatch.estimatedSpoilageCost).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-extrabold">
                          <span className="text-emerald-900">{lang === "mr" ? "अंतिम निव्वळ नफा (Net):" : "Estimated Net Take-Home:"}</span>
                          <span className="text-emerald-700">₹{decision.bestBuyerMatch.estimatedNetRealization.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setOfferModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {lang === "mr" ? "ऑफर पहा (View Offers)" : "View Offers"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-slate-500 shadow-sm flex flex-col justify-center">
                    <p>{lang === "mr" ? "योग्य खरेदीदार आढळला नाही" : "No suitable buyer match found"}</p>
                  </div>
                )}

                {/* CARD 2: BEST APMC MANDI */}
                {hasMandi && decision.bestMandi ? (
                  <div className={`bg-white rounded-2xl border ${
                    isMandiWinner ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                  } p-5 flex flex-col justify-between shadow-sm relative overflow-hidden`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                          isMandiWinner
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {isMandiWinner ? "RECOMMENDED" : "ALTERNATIVE"}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">{decision.bestMandi.district}</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                        {decision.bestMandi.mandiName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">{lang === "mr" ? "शासकीय APMC लिलाव बाजार" : "Government APMC Auction Market"}</p>

                      <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "अंतर (Distance):" : "Distance:"}</span>
                          <span className="font-semibold text-slate-800">{decision.bestMandi.distanceKm} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "सरासरी दर (Modal):" : "APMC Modal Price:"}</span>
                          <span className="font-bold text-slate-900">₹{decision.bestMandi.modalPricePerQtl.toLocaleString("en-IN")}/Qtl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "एकूण उत्पन्न (Gross):" : "Gross Revenue:"}</span>
                          <span className="text-slate-900 font-semibold">₹{decision.bestMandi.grossRevenue.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{lang === "mr" ? "वाहतूक, कर व तूट:" : "Transport / APMC / Spoilage:"}</span>
                          <span className="text-rose-700 font-bold">-₹{decision.bestMandi.estimatedLogisticsCost.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-extrabold">
                          <span className="text-slate-900">{lang === "mr" ? "अंतिम निव्वळ नफा (Net):" : "Estimated Net Take-Home:"}</span>
                          <span className="text-emerald-700">₹{decision.bestMandi.estimatedNetRealization.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => setShowRankedList(!showRankedList)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 rounded-xl border border-slate-300 transition-all"
                      >
                        <Store className="w-3.5 h-3.5 text-slate-600" />
                        {showRankedList
                          ? (lang === "mr" ? "रँकिंग लपवा" : "Hide Ranked Markets")
                          : (lang === "mr" ? "रँक केलेले बाजार पहा" : "View Ranked Markets")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          BEST APMC MANDI
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                          NO BENCHMARK
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mt-2">
                        <Store className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                        {lang === "mr" ? "बाजार तुलना उपलब्ध नाही" : "No nearby market data available"}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                        {lang === "mr"
                          ? "या पिकासाठी कोणताही जुळणारा APMC बेंचमार्क बाजार भाव सध्या उपलब्ध नाही."
                          : "No nearby market data available for this crop."}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "search" }));
                          onClose();
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 rounded-xl border border-slate-300 transition-all"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-600" />
                        {lang === "mr" ? "मार्केट सर्च उघडा (Open Market Search)" : "Open Market Search"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expandable Unified Ranked Markets Breakdown */}
              {showRankedList && decision.rankedMarkets && decision.rankedMarkets.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600" />
                        {lang === "mr" ? "स्थानिक APMC बाजार क्रमवारी (Ranked Markets)" : "Authoritative Ranked APMC Markets"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lang === "mr"
                          ? `आपल्या मूळ स्थानावरून (${lot.origin || lot.district || "Farm Gate"}) मोजलेली क्रमवारी`
                          : `Calculated from your origin (${lot.origin || lot.district || "Farm Gate"})`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("prisms:navigate_to_ranking", {
                            detail: {
                              cropName: lot.cropName,
                              quantityQtl: lot.quantityQtl,
                              origin: lot.origin || lot.district,
                              lotId: lot.lotId,
                            },
                          })
                        );
                        onClose();
                      }}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      {lang === "mr" ? "मार्केट सर्च मध्ये उघडा →" : "Open in Market Search →"}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">{lang === "mr" ? "बाजार समिती" : "Market / APMC"}</th>
                          <th className="py-2.5 px-3">{lang === "mr" ? "अंतर" : "Distance"}</th>
                          <th className="py-2.5 px-3">{lang === "mr" ? "सरासरी भाव" : "Modal Price"}</th>
                          <th className="py-2.5 px-3">{lang === "mr" ? "वाहतूक व खर्च" : "Logistics & Costs"}</th>
                          <th className="py-2.5 px-3 text-right">{lang === "mr" ? "निव्वळ परतावा" : "Est. Net Take-Home"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {decision.rankedMarkets.map((m) => (
                          <tr key={m.marketId} className={m.rank === 1 ? "bg-emerald-50/50 font-medium" : "hover:bg-slate-50"}>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                                m.rank === 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                {m.rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{m.marketName}</div>
                              <div className="text-[10px] text-slate-500">{m.district}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">{m.distanceKm} km</td>
                            <td className="py-2.5 px-3 text-slate-900 font-semibold">₹{m.modalPrice.toLocaleString("en-IN")}/Qtl</td>
                            <td className="py-2.5 px-3 text-rose-700 font-medium">-₹{m.estimatedLogisticsCost.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 text-sm">
                              ₹{m.estimatedNetRealization.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Match Explanation Breakdown */}
              {decision.bestBuyerMatch && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    {lang === "mr" ? "हा खरेदीदार का शिफारसित आहे? (Why This Buyer?)" : "Why This Buyer Match?"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <span className="font-bold text-emerald-800 block">{lang === "mr" ? "अनुकूल घटक (Positive Factors):" : "Positive Factors:"}</span>
                      {decision.bestBuyerMatch.reasons.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {decision.bestBuyerMatch.warnings.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-amber-800 block">{lang === "mr" ? "महत्त्वाच्या सूचना (Potential Issues):" : "Potential Issues / Warnings:"}</span>
                        {decision.bestBuyerMatch.warnings.map((w, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-amber-900 font-medium">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalMarkup, document.body)}
      {offerModalOpen && (
        <OfferComparisonModal
          lot={lot}
          isOpen={true}
          onClose={() => setOfferModalOpen(false)}
          lang={lang}
        />
      )}
    </>
  );
}
