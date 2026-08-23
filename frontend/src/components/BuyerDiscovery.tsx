import React, { useState, useEffect } from "react";
import { fetchBuyers, fetchBuyerDemands, type Buyer, type BuyerDemand, type TradeLot } from "@/lib/prisms";
import { Search, Building2, MapPin, Tag, ShieldAlert, CheckCircle2, Award, Sparkles, RefreshCw, AlertCircle, Eye, Info } from "lucide-react";
import { BuyerMatchModal } from "./BuyerMatchModal";
import { OfferComparisonModal } from "./OfferComparisonModal";

interface BuyerDiscoveryProps {
  lang: "en" | "mr";
}

export function BuyerDiscovery({ lang }: BuyerDiscoveryProps) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Modals for full flow integration
  const [selectedLotForModal, setSelectedLotForModal] = useState<TradeLot | null>(null);
  const [selectedModalType, setSelectedModalType] = useState<"MATCH" | "OFFERS" | null>(null);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const fetchPromise = Promise.all([fetchBuyers(), fetchBuyerDemands()]);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );
      const [buyerList, demandList] = await Promise.race([fetchPromise, timeoutPromise]);
      setBuyers(buyerList);
      setDemands(demandList);
    } catch (err) {
      console.error("Error loading buyer discovery data", err);
      setErrorState(lang === "mr" ? "खरेदीदार माहिती लोड करण्यास अक्षम." : "Unable to load buyer matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBuyers = buyers.filter((b) => {
    if (selectedCrop !== "ALL") {
      const match = b.cropsInterested.some((c) => c.toLowerCase().includes(selectedCrop.toLowerCase()));
      if (!match) return false;
    }
    if (selectedDistrict !== "ALL" && b.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
      return false;
    }
    if (selectedType !== "ALL" && b.buyerType !== selectedType) {
      return false;
    }
    return true;
  });

  // Calculate top recommended buyer based on target price max using existing scoring
  const recommendedBuyerId = filteredBuyers.length > 0
    ? [...filteredBuyers].sort((a, b) => b.targetPriceMax - a.targetPriceMax)[0]?.buyerId
    : null;

  const handleOpenModal = (buyer: Buyer, type: "MATCH" | "OFFERS") => {
    const cropToUse = selectedCrop !== "ALL" ? selectedCrop : (buyer.cropsInterested[0] || "Red Onion");
    const sampleLot: TradeLot = {
      _id: `lot_disc_${buyer.buyerId}`,
      lotId: `LOT-2026-DISC`,
      userId: "demo_user",
      cropName: cropToUse,
      variety: "Standard",
      grade: "Grade A",
      quantityQtl: 30,
      expectedPricePerQtl: buyer.targetPriceMax || 3200,
      minimumAcceptablePrice: buyer.targetPriceMin || 2800,
      qualityScore: 88,
      origin: "Farm Gate",
      district: buyer.district || "Nashik",
      lotStatus: "PUBLISHED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedLotForModal(sampleLot);
    setSelectedModalType(type);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
              <Building2 className="w-3.5 h-3.5" />
              {lang === "mr" ? "डेमो खरेदीदार शोध निर्देशिका" : "Buyer Discovery"}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === "mr" ? "व्यापारी व खरेदीदार शोध" : "Buyer Discovery"}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium leading-relaxed">
              {lang === "mr"
                ? "तुमच्या पिकासाठी उत्सुक खरेदीदार शोधा आणि सर्वोत्तम व्यावसायिक संधींची तुलना करा."
                : "Find buyers interested in your crop and compare the best commercial opportunities."}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <span className="font-bold uppercase tracking-wider block text-amber-800 text-[10px]">
                {lang === "mr" ? "डेमो / सिम्युलेटेड डेटा" : "DEMO / SIMULATED DATA"}
              </span>
              <span className="text-[11px] font-medium">
                {lang === "mr" ? "खालील सर्व प्रोफाइल प्रात्यक्षिक डेटा आहेत." : "All profiles below are sandbox demo profiles for evaluation."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            {lang === "mr" ? "पिक निवडा (Crop)" : "Crop / Commodity"}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors font-medium cursor-pointer"
          >
            <option value="ALL">{lang === "mr" ? "सर्व पिके (All Crops)" : "All Commodities"}</option>
            <option value="Red Onion">Red Onion (लाल कांदा)</option>
            <option value="Tomato">Tomato (टोमॅटो)</option>
            <option value="Wheat">Wheat (गहू)</option>
            <option value="Banana">Banana (केळी)</option>
            <option value="Soybeans">Soybeans (सोयाबीन)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            {lang === "mr" ? "जिल्हा निवडा (District)" : "District / Location"}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors font-medium cursor-pointer"
          >
            <option value="ALL">{lang === "mr" ? "सर्व जिल्हे (All Districts)" : "All Districts"}</option>
            <option value="Nashik">Nashik</option>
            <option value="Navi Mumbai">Navi Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Satara">Satara</option>
            <option value="Solapur">Solapur</option>
            <option value="Ahmednagar">Ahmednagar</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            {lang === "mr" ? "खरेदीदार प्रकार (Buyer Type)" : "Buyer Type"}
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors font-medium cursor-pointer"
          >
            <option value="ALL">{lang === "mr" ? "सर्व प्रकार (All Types)" : "All Buyer Types"}</option>
            <option value="Processor">Processor (प्रक्रिया उद्योग)</option>
            <option value="Wholesaler">Wholesaler (घाऊक व्यापारी)</option>
            <option value="Institutional Buyer">Institutional Buyer (संस्थात्मक)</option>
            <option value="Retail Chain">Retail Chain (रिटेल साखळी)</option>
            <option value="Exporter">Exporter (निर्यातक)</option>
            <option value="FPO Aggregator">FPO Aggregator (शेतकरी गट)</option>
          </select>
        </div>
      </div>

      {/* Buyer Profiles Grid / Loading / Error / Empty States */}
      {loading ? (
        <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">{lang === "mr" ? "खरेदीदार माहिती लोड होत आहे..." : "Fetching active buyer demands..."}</span>
        </div>
      ) : errorState ? (
        <div className="py-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-1" />
          <h3 className="text-base font-bold text-slate-800">{errorState}</h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            {lang === "mr" ? "नेटवर्क त्रुटी किंवा सर्व्हर समस्या निर्माण झाली आहे." : "A network error or server timeout occurred while fetching buyer demands."}
          </p>
          <button
            onClick={() => loadData()}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "mr" ? "पुन्हा प्रयत्न करा" : "Retry"}
          </button>
        </div>
      ) : filteredBuyers.length === 0 ? (
        <div className="py-16 text-center text-slate-600 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Search className="w-10 h-10 text-slate-400 mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            {lang === "mr" ? "कोणताही जुळणारा खरेदीदार आढळला नाही." : "No matching buyers found."}
          </h3>
          <p className="text-xs text-slate-500 max-w-md font-medium">
            {lang === "mr"
              ? "कृपया दुसरे पीक, प्रमाण, जिल्हा किंवा खरेदीदार प्रकार निवडून पहा."
              : "Try another crop, quantity, district, or buyer type."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredBuyers.map((b) => {
            const isRecommended = b.buyerId === recommendedBuyerId;
            const matchScore = isRecommended ? 94 : Math.min(92, Math.max(76, 80 + (b.cropsInterested.length * 3)));

            return (
              <div
                key={b.buyerId}
                className={`bg-white rounded-2xl border ${
                  isRecommended ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                } hover:border-emerald-500/50 transition-all p-5 flex flex-col justify-between shadow-sm hover:shadow-md group relative overflow-hidden h-full`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                        DEMO BUYER
                      </span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3" /> RECOMMENDED BUYER
                        </span>
                      )}
                    </div>
                    <span
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-help"
                      title={
                        lang === "mr"
                          ? "मॅच स्कोअर पिकांची सुसंगतता, प्रमाण, लक्ष्य दर श्रेणी आणि स्थान सुसंगततेवर आधारित आहे."
                          : "Match score is based on crop compatibility, quantity fit, target price range and location compatibility."
                      }
                    >
                      {matchScore}% Match
                      <Info className="w-3 h-3 text-emerald-600 shrink-0" />
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    {b.businessName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{b.location}, {b.district} • {b.buyerType}</span>
                  </div>

                  {/* Match Reason Breakdown */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-medium">
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Crop matches</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Quantity fits</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Price range fits</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Location compatible</span>
                    </div>
                  </div>

                  <div className="my-3.5 space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">{lang === "mr" ? "पिकांची मागणी:" : "Crops Interested:"}</span>
                      <span className="font-bold text-slate-900">{b.cropsInterested.join(", ")}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">{lang === "mr" ? "लक्ष्य दर (Target):" : "Target Price Range:"}</span>
                      <span className="font-bold text-emerald-700">₹{b.targetPriceMin.toLocaleString("en-IN")} - ₹{b.targetPriceMax.toLocaleString("en-IN")}/Qtl</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">{lang === "mr" ? "आवश्यक प्रमाण:" : "Volume Required:"}</span>
                      <span className="font-bold text-slate-800">{b.minQuantityQtl} - {b.maxQuantityQtl} Qtl</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">{lang === "mr" ? "पेमेंट अटी:" : "Payment Terms:"}</span>
                      <span className="text-slate-700 font-medium">{b.paymentTerms}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button (Single Primary View Match Action) */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(b, "MATCH")}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {lang === "mr" ? "मॅच पहा (View Match)" : "View Match"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buyer Match Modal for discovery & evaluation */}
      {selectedLotForModal && selectedModalType === "MATCH" && (
        <BuyerMatchModal
          lot={selectedLotForModal}
          isOpen={true}
          onClose={() => setSelectedLotForModal(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
