import React, { useState, useEffect } from "react";
import { fetchUserLots, createTradeLot, deleteTradeLot, getAcceptedOfferForLot, type TradeLot, type CropBatchItem } from "@/lib/prisms";
import { BuyerMatchModal } from "./BuyerMatchModal";
import { OfferComparisonModal } from "./OfferComparisonModal";
import { Package, Plus, Trash2, Tag, TrendingUp, Building2, CheckCircle2, AlertCircle, RefreshCw, Truck, DollarSign, ArrowRight } from "lucide-react";

interface TradeLotsManagerProps {
  cropBatches: CropBatchItem[];
  lang: "en" | "mr";
}

export function TradeLotsManager({ cropBatches, lang }: TradeLotsManagerProps) {
  const [lots, setLots] = useState<TradeLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLotForMatch, setSelectedLotForMatch] = useState<TradeLot | null>(null);
  const [selectedLotForOffers, setSelectedLotForOffers] = useState<TradeLot | null>(null);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [cropName, setCropName] = useState("Red Onion");
  const [variety, setVariety] = useState("Garwa");
  const [grade, setGrade] = useState("Grade A");
  const [quantityQtl, setQuantityQtl] = useState<number>(30);
  const [expectedPrice, setExpectedPrice] = useState<number>(3000);
  const [minPrice, setMinPrice] = useState<number>(2600);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadLots = async () => {
    setLoading(true);
    const data = await fetchUserLots();
    const updated = data.map(l => {
      const acceptedId = getAcceptedOfferForLot(l._id) || getAcceptedOfferForLot(l.lotId);
      if (acceptedId || l.lotStatus === 'ACCEPTED') {
        return { ...l, lotStatus: 'ACCEPTED' as const };
      }
      return l;
    });
    setLots(updated);
    setLoading(false);
  };

  useEffect(() => {
    loadLots();
  }, []);

  const handleSelectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    const batch = cropBatches.find((b) => b._id === batchId);
    if (batch) {
      setCropName(batch.cropName);
      setVariety(batch.variety || "Standard");
      setGrade(batch.grade || "Grade A");
      setQuantityQtl(Math.round(batch.quantityKg / 100) || 10);
      if (batch.estimatedRealization) {
        const estPrice = Math.round(batch.estimatedRealization / (batch.quantityKg / 100));
        if (estPrice > 500) {
          setExpectedPrice(estPrice);
          setMinPrice(Math.round(estPrice * 0.85));
        }
      }
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submit
    setFormError("");

    if (!quantityQtl || quantityQtl <= 0) {
      setFormError(lang === "mr" ? "प्रमाण ० पेक्षा जास्त असणे आवश्यक आहे." : "Quantity must be greater than 0 Qtl.");
      return;
    }

    try {
      setSubmitting(true);
      await createTradeLot({
        cropBatchId: selectedBatchId || undefined,
        cropName,
        variety,
        grade,
        quantityQtl: Number(quantityQtl),
        expectedPricePerQtl: Number(expectedPrice),
        minimumAcceptablePrice: Number(minPrice),
      });
      setCreateOpen(false);
      await loadLots();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || "Failed to create trade lot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lotId: string) => {
    if (confirm(lang === "mr" ? "तुम्हाला हा व्यापार लॉट हटवायचा आहे का?" : "Are you sure you want to delete this trade lot?")) {
      await deleteTradeLot(lotId);
      await loadLots();
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1 border border-emerald-200">
            <Package className="w-3.5 h-3.5" />
            {lang === "mr" ? "व्यापार लॉट व्यवस्थापन" : "Trade Lot Management"}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {lang === "mr" ? "माझे व्यापार लॉट्स (My Trade Lots)" : "My Trade Lots"}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {lang === "mr"
              ? "पिक काढणीचे व्यापार लॉट तयार करा आणि थेट व्यापारी मागणीशी मॅच करा."
              : "Standardize your produce into formal trade lots (LOT-2026-XXXX) for direct buyer matching."}
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {lang === "mr" ? "नवीन व्यापार लॉट तयार करा" : "Create New Trade Lot"}
        </button>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              {lang === "mr" ? "व्यापार लॉट तयार करा (Create Trade Lot)" : "Create Trade Lot"}
            </h3>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
              {cropBatches.length > 0 && (
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    {lang === "mr" ? "काढणी बॅचमधून भरा (From Harvest Batch):" : "Autofill from Harvest Batch:"}
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => handleSelectBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="">{lang === "mr" ? "-- नवीन लॉट प्रविष्ट करा --" : "-- Select existing crop batch --"}</option>
                    {cropBatches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.cropName} ({Math.round(b.quantityKg / 100)} Qtl) • {b.grade}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "पिक नाव:" : "Crop Name:"}</label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "वाण (Variety):" : "Variety:"}</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "दर्जा (Grade):" : "Grade:"}</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Grade A">Grade A (उत्कृष्ट)</option>
                    <option value="Grade B">Grade B (मध्यम)</option>
                    <option value="FAQ">FAQ (सर्वसाधारण)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "प्रमाण (क्विंटल):" : "Quantity (Quintals):"}</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityQtl}
                    onChange={(e) => setQuantityQtl(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "अपेक्षित भाव (₹/Qtl):" : "Expected Price (₹/Qtl):"}</label>
                  <input
                    type="number"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "किरकोळ भाव मर्यादा (Min ₹):" : "Min Acceptable Price (₹):"}</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {lang === "mr" ? "रद्द करा" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  {submitting ? "Creating..." : lang === "mr" ? "लॉट जतन करा" : "Create Trade Lot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lots Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-600">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3" />
          <p>{lang === "mr" ? "व्यापार लॉट्स लोड होत आहेत..." : "Loading trade lots..."}</p>
        </div>
      ) : lots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            {lang === "mr" ? "कोणताही व्यापार लॉट तयार केलेला नाही" : "No Trade Lots Found"}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {lang === "mr"
              ? "तुमच्या काढणी केलेल्या पिकाचा पहिला व्यापार लॉट तयार करा आणि थेट खरेदीदारांशी मॅच करा."
              : "Create your first trade lot to unlock direct buyer matching and mandi net realization comparison."}
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {lang === "mr" ? "पहिला लॉट तयार करा" : "Create your first trade lot"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
          {lots.map((lot) => {
            const estTotalValue = (lot.quantityQtl || 0) * (lot.expectedPricePerQtl || 0);
            const acceptedOfferId = getAcceptedOfferForLot(lot._id) || getAcceptedOfferForLot(lot.lotId);
            const isAccepted = lot.lotStatus === "ACCEPTED" || Boolean(acceptedOfferId);
            const isOfferedOrMatched = lot.lotStatus === "OFFERED" || lot.lotStatus === "MATCHED";

            return (
              <div
                key={lot._id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs px-2.5 py-0.5 rounded">
                        {lot.lotId}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : lot.lotStatus === "OFFERED"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : lot.lotStatus === "MATCHED" || lot.lotStatus === "PUBLISHED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {isAccepted ? "ACCEPTED" : lot.lotStatus}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(lot.lotId)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                      title="Delete Lot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                    {lot.cropName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                    <span>{lot.variety}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{lot.grade}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-800">{lot.quantityQtl} Qtl</span>
                  </div>

                  {/* 3-Column Financial Grid */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">{lang === "mr" ? "अपेक्षित भाव:" : "Expected Price:"}</span>
                      <span className="font-bold text-slate-900">₹{lot.expectedPricePerQtl.toLocaleString("en-IN")}/Qtl</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">{lang === "mr" ? "किरकोळ मर्यादा:" : "Min Acceptable:"}</span>
                      <span className="font-bold text-slate-700">₹{lot.minimumAcceptablePrice.toLocaleString("en-IN")}/Qtl</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">{lang === "mr" ? "अंदाजे मूल्य:" : "Est. Total Value:"}</span>
                      <span className="font-bold text-emerald-700">₹{estTotalValue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Status Flow Stepper */}
                  <div className="mt-3.5 pt-2 pb-1 px-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1.5">
                      <span>{lang === "mr" ? "प्रगती प्रवाह (Status Flow)" : "Status Flow"}</span>
                      <span className="text-emerald-700 font-bold">{isAccepted ? "ACCEPTED" : lot.lotStatus}</span>
                    </div>
                    <div className="flex items-center justify-between relative px-2">
                      <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-200 z-0"></div>
                      <div
                        className="absolute top-2 left-4 h-0.5 bg-emerald-500 z-0 transition-all duration-300"
                        style={{
                          width:
                            isAccepted || lot.lotStatus === "OFFERED"
                              ? "calc(100% - 2rem)"
                              : lot.lotStatus === "MATCHED"
                              ? "66%"
                              : "33%",
                        }}
                      ></div>

                      {[
                        { label: lang === "mr" ? "काढणी" : "Harvest", active: true },
                        { label: lang === "mr" ? "व्यापार लॉट" : "Trade Lot", active: true },
                        {
                          label: lang === "mr" ? "मॅचिंग" : "Buyer Match",
                          active: ["MATCHED", "OFFERED", "ACCEPTED"].includes(lot.lotStatus) || isAccepted,
                        },
                        {
                          label: lang === "mr" ? "ऑफर" : "Offer",
                          active: ["OFFERED", "ACCEPTED"].includes(lot.lotStatus) || isAccepted,
                        },
                      ].map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-1 bg-slate-50/90 px-1">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              step.active
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step.active ? "✓" : idx + 1}
                          </div>
                          <span
                            className={`text-[9px] font-medium leading-none ${
                              step.active ? "text-emerald-800 font-bold" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isAccepted ? (
                  <div className="pt-3 mt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{lot.origin || "Farm Gate"} • {new Date(lot.createdAt).toLocaleDateString()}</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        {lang === "mr" ? "सौदा निश्चित (Deal Confirmed)" : "Deal Confirmed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                      {/* 1. Track Delivery (Primary) */}
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "delivery" }));
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-2.5 rounded-xl shadow-sm transition-all text-center whitespace-nowrap"
                      >
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === "mr" ? "वितरण ट्रॅक करा" : "Track Delivery"}</span>
                      </button>

                      {/* 2. View Payment (Secondary) */}
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "payments" }));
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold h-9 px-2.5 rounded-xl border border-blue-200 shadow-sm transition-all text-center whitespace-nowrap"
                      >
                        <DollarSign className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                        <span>{lang === "mr" ? "पेमेंट पहा" : "View Payment"}</span>
                      </button>

                      {/* 3. View Transaction (Secondary) */}
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "transactions" }));
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold h-9 px-2.5 rounded-xl border border-slate-300 shadow-sm transition-all text-center whitespace-nowrap"
                      >
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                        <span>{lang === "mr" ? "व्यवहार इतिहास" : "View Transaction"}</span>
                      </button>

                      {/* 4. View Offers (Secondary Review) */}
                      <button
                        onClick={() => setSelectedLotForOffers(lot)}
                        className="inline-flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold h-9 px-2.5 rounded-xl border border-amber-300/80 shadow-sm transition-all text-center whitespace-nowrap"
                      >
                        <Tag className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                        <span>{lang === "mr" ? "ऑफर पहा" : "View Offers"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      {lot.origin || "Farm Gate"} • {new Date(lot.createdAt).toLocaleDateString()}
                    </span>

                    {isOfferedOrMatched ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedLotForMatch(lot)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 transition-all"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {lang === "mr" ? "व्यापारी मॅच शोधा" : "Find Matching Buyers"}
                        </button>

                        <button
                          onClick={() => setSelectedLotForOffers(lot)}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all"
                        >
                          {lang === "mr" ? "डिजिटल ऑफर्स पहा" : "View Offers"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedLotForOffers(lot)}
                          className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-300/80 shadow-sm transition-all"
                        >
                          {lang === "mr" ? "डिजिटल ऑफर्स पहा" : "View Offers"}
                        </button>

                        <button
                          onClick={() => setSelectedLotForMatch(lot)}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {lang === "mr" ? "व्यापारी मॅच शोधा" : "Find Matching Buyers"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Buyer Match Modal */}
      {selectedLotForMatch && (
        <BuyerMatchModal
          lot={selectedLotForMatch}
          isOpen={!!selectedLotForMatch}
          onClose={() => setSelectedLotForMatch(null)}
          lang={lang}
        />
      )}

      {/* Offer Comparison Modal */}
      {selectedLotForOffers && (
        <OfferComparisonModal
          lot={selectedLotForOffers}
          isOpen={!!selectedLotForOffers}
          onClose={() => setSelectedLotForOffers(null)}
          onOfferAccepted={() => loadLots()}
          lang={lang}
        />
      )}
    </div>
  );
}
