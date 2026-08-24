import React, { useState, useEffect } from "react";
import {
  fetchUserLots,
  createTradeLot,
  deleteTradeLot,
  getAcceptedOfferForLot,
  type TradeLot,
  type CropBatchItem,
  type QualityAssessmentResult,
} from "@/lib/prisms";
import { BuyerMatchModal } from "./BuyerMatchModal";
import { OfferComparisonModal } from "./OfferComparisonModal";
import { QualityAssessmentWizard } from "./QualityAssessmentWizard";
import { QualityPassportModal } from "./QualityPassportModal";
import {
  Package,
  Plus,
  Trash2,
  Tag,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Truck,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

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

  // Quality Assessment State
  const [qualityWizardOpen, setQualityWizardOpen] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityAssessmentResult | null>(null);
  const [selectedLotForPassport, setSelectedLotForPassport] = useState<TradeLot | null>(null);

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

  const [addQualityAssessment, setAddQualityAssessment] = useState(false);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submit
    setFormError("");

    if (!quantityQtl || quantityQtl <= 0) {
      setFormError(lang === "mr" ? "प्रमाण ० पेक्षा जास्त असणे आवश्यक आहे." : "Quantity must be greater than 0 Qtl.");
      return;
    }

    // Proceed to create the lot directly
    handleCreateLot();
  };

  const handleCreateLot = async () => {
    try {
      setSubmitting(true);
      const hasAssessment = Boolean(qualityResult);

      await createTradeLot({
        cropBatchId: selectedBatchId || undefined,
        cropName,
        variety,
        grade: hasAssessment ? (qualityResult?.provisionalGrade || grade) : grade,
        provisionalGrade: hasAssessment ? (qualityResult?.provisionalGrade || grade) : undefined,
        quantityQtl: Number(quantityQtl),
        expectedPricePerQtl: Number(expectedPrice),
        minimumAcceptablePrice: Number(minPrice),
        qualityScore: hasAssessment ? qualityResult?.qualityScore : undefined,
        evidenceConfidence: hasAssessment ? qualityResult?.evidenceConfidence : undefined,
        qualityAssessmentId: hasAssessment ? (qualityResult?.assessmentId || qualityResult?._id) : undefined,
        qualityPassport: hasAssessment ? qualityResult?.passportSummary : undefined,
      });
      setCreateOpen(false);
      setQualityResult(null);
      await loadLots();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || "Failed to create trade lot.");
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
          onClick={() => {
            setCreateOpen(true);
            setQualityResult(null);
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {lang === "mr" ? "नवीन व्यापार लॉट तयार करा" : "Create New Trade Lot"}
        </button>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                {lang === "mr" ? "व्यापार लॉट तयार करा (Create Trade Lot)" : "Create Trade Lot"}
              </h3>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
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
                  <label className="text-slate-700 font-medium block mb-1">{lang === "mr" ? "पिक निवडा / नाव:" : "Crop Name:"}</label>
                  <select
                    value={["Red Onion", "White Onion", "Garwa Onion", "Sharbati Wheat", "Yellow Soybeans", "Hybrid Tomato", "Potato", "Banana"].includes(cropName) ? cropName : "Other"}
                    onChange={(e) => {
                      if (e.target.value !== "Other") {
                        setCropName(e.target.value);
                        if (e.target.value.includes("Onion")) setVariety("Garwa");
                        else if (e.target.value.includes("Wheat")) setVariety("Sharbati");
                        else if (e.target.value.includes("Soybean")) setVariety("JS-335");
                        else if (e.target.value.includes("Tomato")) setVariety("Abhinav");
                        else if (e.target.value.includes("Potato")) setVariety("Kufri Jyoti");
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:bg-white font-bold"
                  >
                    <option value="Red Onion">🧅 Red Onion (Nashik)</option>
                    <option value="Garwa Onion">🧅 Garwa Red Onion</option>
                    <option value="White Onion">🧅 White Onion</option>
                    <option value="Sharbati Wheat">🌾 Sharbati Wheat</option>
                    <option value="Yellow Soybeans">🌱 Yellow Soybeans</option>
                    <option value="Hybrid Tomato">🍅 Hybrid Tomato</option>
                    <option value="Potato">🥔 Potato</option>
                    <option value="Banana">🍌 Banana</option>
                    <option value="Other">Custom Crop...</option>
                  </select>
                  {!["Red Onion", "White Onion", "Garwa Onion", "Sharbati Wheat", "Yellow Soybeans", "Hybrid Tomato", "Potato", "Banana"].includes(cropName) && (
                    <input
                      type="text"
                      placeholder="Enter custom crop name"
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      required
                      className="w-full mt-1.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2 text-xs focus:border-emerald-600 focus:bg-white"
                    />
                  )}
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

              {/* Compact Grade & Quality Assessment Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold block text-xs">
                    {lang === "mr" ? "दर्जा (Grade):" : "Grade:"}
                  </label>
                  {qualityResult ? (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {lang === "mr" ? `मूल्यांकन: ${qualityResult.provisionalGrade}` : `Assessed: ${qualityResult.provisionalGrade}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      {lang === "mr" ? "शेतकरी घोषित (Farmer Declared)" : "Farmer Declared"}
                    </span>
                  )}
                </div>

                <select
                  value={qualityResult ? qualityResult.provisionalGrade : grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setQualityResult(null);
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs font-semibold focus:border-emerald-600 focus:bg-white"
                >
                  <option value="Grade A">Grade A ({lang === "mr" ? "उत्तम" : "Grade A"})</option>
                  <option value="Grade B">Grade B ({lang === "mr" ? "मध्यम" : "Grade B"})</option>
                  <option value="Grade C">Grade C ({lang === "mr" ? "सामान्य" : "Grade C"})</option>
                </select>

                {/* Helper Information Message */}
                <div className="text-[11px] text-slate-500 leading-relaxed space-y-0.5 pt-0.5">
                  <p className="font-medium text-slate-600">
                    {lang === "mr" ? "पिकाची गुणवत्ता ठाऊक आहे? वरील दर्जा निवडा." : "Know your crop quality? Select the grade above."}
                  </p>
                  <p className="text-slate-500">
                    {lang === "mr"
                      ? "खात्री नाही? PRISMS ला पीक-विशिष्ट प्रश्नावलीद्वारे गुणवत्ता मूल्यांकन करू द्या."
                      : "Not sure? Let PRISMS assess your crop using a crop-specific quality questionnaire."}
                  </p>
                </div>

                {/* Optional Assessment Action / Result */}
                {qualityResult ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs mt-1 animate-in fade-in">
                    <div className="space-y-0.5">
                      <div className="font-black text-emerald-900 flex items-center gap-2">
                        <span>Assessed Grade: {qualityResult.provisionalGrade}</span>
                        <span className="text-[10px] text-slate-400 font-normal">•</span>
                        <span className="text-emerald-700 font-bold">Score: {qualityResult.qualityScore}/100</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Confidence: {qualityResult.evidenceConfidence}% • Quality Passport Attached (Provisional)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQualityWizardOpen(true)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        {lang === "mr" ? "बदला" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQualityResult(null)}
                        className="p-1 text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                        title="Remove Assessment"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setQualityWizardOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>{lang === "mr" ? "पिक गुणवत्ता तपासा (Check Crop Quality)" : "Check Crop Quality"}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium italic">Optional</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setQualityResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === "mr" ? "रद्द करा" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? lang === "mr"
                        ? "तयार करत आहे..."
                        : "Creating..."
                      : qualityResult
                      ? lang === "mr"
                        ? "लॉट तयार करा (पासपोर्ट संलग्न)"
                        : "Confirm & Create Trade Lot"
                      : lang === "mr"
                      ? "लॉट तयार करा"
                      : "Create Trade Lot"}
                  </span>
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

            return (
              <div
                key={lot._id || lot.lotId}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/60 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Lot Header & ID */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {lot.lotId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : lot.lotStatus === "OFFERED"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isAccepted ? "ACCEPTED" : lot.lotStatus}
                      </span>
                    </div>
                  </div>

                  {/* Crop Title & Meta */}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{lot.cropName}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{lot.quantityQtl} Qtl</span>
                      <span>•</span>
                      <span>{lot.origin || "Farm Gate"}, {lot.district || "Nashik"}</span>
                    </p>
                  </div>

                  {/* Grade & Quality Status */}
                  <div className="text-xs text-slate-600 font-medium">
                    <span>{lot.provisionalGrade || lot.grade || "Grade A"}</span>
                    <span className="mx-1.5">•</span>
                    {lot.qualityScore || lot.qualityPassport ? (
                      <button
                        type="button"
                        onClick={() => setSelectedLotForPassport(lot)}
                        className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Score {lot.qualityScore}/100</span>
                        <span className="text-[10px] text-slate-400 font-normal">({lot.evidenceConfidence || 80}% Confidence)</span>
                      </button>
                    ) : (
                      <span className="text-slate-500">Quality Assessment Not Provided</span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Price</span>
                      <span className="text-lg font-black text-slate-900">
                        ₹{lot.expectedPricePerQtl.toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-slate-500"> /Qtl</span>
                      </span>
                    </div>
                    {lot.minimumAcceptablePrice && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Min: ₹{lot.minimumAcceptablePrice.toLocaleString("en-IN")}/Qtl
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {isAccepted ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("prisms:navigate_tab", { detail: "delivery" }));
                        }}
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{lang === "mr" ? "वितरण ट्रॅक करा" : "Track Delivery"}</span>
                      </button>
                      <button
                        onClick={() => setSelectedLotForOffers(lot)}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5 text-slate-600" />
                        <span>Offers</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedLotForOffers(lot)}
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{lang === "mr" ? "ऑफर पहा" : "View Offers"}</span>
                      </button>
                      <button
                        onClick={() => setSelectedLotForMatch(lot)}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Buyer Match"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">Buyer Match</span>
                      </button>
                      <button
                        onClick={() => handleDelete(lot.lotId)}
                        className="p-2.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors"
                        title="Delete Lot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
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

      {/* Quality Assessment Wizard Modal */}
      {qualityWizardOpen && (
        <QualityAssessmentWizard
          isOpen={qualityWizardOpen}
          onClose={() => setQualityWizardOpen(false)}
          cropName={cropName}
          variety={variety}
          cropBatchId={selectedBatchId || undefined}
          onAssessmentCompleted={(result) => {
            setQualityResult(result);
            setGrade(result.provisionalGrade);
          }}
          onConfirmAndCreate={async (result) => {
            setQualityResult(result);
            setGrade(result.provisionalGrade);
            try {
              setSubmitting(true);
              await createTradeLot({
                cropBatchId: selectedBatchId || undefined,
                cropName,
                variety,
                grade: result.provisionalGrade || grade,
                provisionalGrade: result.provisionalGrade || grade,
                quantityQtl: Number(quantityQtl),
                expectedPricePerQtl: Number(expectedPrice),
                minimumAcceptablePrice: Number(minPrice),
                qualityScore: result.qualityScore || 85,
                evidenceConfidence: result.evidenceConfidence || 80,
                qualityAssessmentId: result.assessmentId || (result as any)._id,
                qualityPassport: result.passportSummary,
              });
              setQualityWizardOpen(false);
              setCreateOpen(false);
              setQualityResult(null);
              await loadLots();
            } catch (err: any) {
              setFormError(err.response?.data?.error?.message || err.message || "Failed to create trade lot.");
            } finally {
              setSubmitting(false);
            }
          }}
          lang={lang}
        />
      )}

      {/* Quality Passport Viewer Modal */}
      {selectedLotForPassport && (
        <QualityPassportModal
          isOpen={!!selectedLotForPassport}
          onClose={() => setSelectedLotForPassport(null)}
          assessment={
            selectedLotForPassport.qualityPassport
              ? ({
                  assessmentId: selectedLotForPassport.qualityAssessmentId || selectedLotForPassport.lotId,
                  cropName: selectedLotForPassport.cropName,
                  variety: selectedLotForPassport.variety,
                  qualityScore: selectedLotForPassport.qualityScore || 85,
                  provisionalGrade: selectedLotForPassport.provisionalGrade || selectedLotForPassport.grade || "Grade A",
                  evidenceConfidence: selectedLotForPassport.evidenceConfidence || 80,
                  criticalFlags: [],
                  positiveFactors: [
                    `Standard grade certification for ${selectedLotForPassport.cropName}`,
                    "Clean harvest batch with verified origin",
                  ],
                  riskFactors: ["Provisional assessment awaiting hub gate verification"],
                  passportSummary: selectedLotForPassport.qualityPassport,
                } as any)
              : null
          }
          lotId={selectedLotForPassport.lotId}
        />
      )}
    </div>
  );
}
