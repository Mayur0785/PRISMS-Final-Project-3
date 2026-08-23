import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Volume2,
  Layers,
  Award,
  ArrowRight,
  Info,
  Bell,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import {
  QualityAssessmentItem,
  PriceAlertItem,
  createQualityAssessmentApi,
  fetchUserAssessments,
  fetchStorageRecommendation,
  fetchSaleWindowRecommendation,
  fetchRiskScore,
  fetchRecommendationExplanation,
  fetchPriceAlerts,
  createPriceAlertApi,
  updatePriceAlertApi,
  deletePriceAlertApi,
} from '../lib/prisms';
import { VoiceSpeaker } from './VoiceSpeaker';
import { t } from '../lib/i18n';

interface IntelligenceSuiteProps {
  lang?: 'en' | 'mr';
}

export const IntelligenceSuite: React.FC<IntelligenceSuiteProps> = ({ lang = 'en' }) => {
  const [assessments, setAssessments] = useState<QualityAssessmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quality Assessor Form State
  const [qCrop, setQCrop] = useState<string>('Red Onion');
  const [qVariety, setQVariety] = useState<string>('Garwa');
  const [qSize, setQSize] = useState<number>(85);
  const [qColor, setQColor] = useState<number>(90);
  const [qFirmness, setQFirmness] = useState<number>(88);
  const [qMoisture, setQMoisture] = useState<number>(12);
  const [qDamage, setQDamage] = useState<number>(2);
  const [qDecay, setQDecay] = useState<number>(0);
  const [latestAssessment, setLatestAssessment] = useState<QualityAssessmentItem | null>(null);

  // Intelligence Data States
  const [storageData, setStorageData] = useState<any>(null);
  const [saleWindowData, setSaleWindowData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [activeExplainType, setActiveExplainType] = useState<string>('WHY_THIS_BUYER');

  // Price Alert Form & List State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertItem[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(3200);
  const [alertMarketName, setAlertMarketName] = useState<string>('Vashi APMC');

  useEffect(() => {
    loadData();
  }, [qCrop]);

  const loadData = async () => {
    setLoading(true);
    const [assList, sData, swData, rData, expData, alertList] = await Promise.all([
      fetchUserAssessments(),
      fetchStorageRecommendation({ cropName: qCrop, holdingDays: 14 }),
      fetchSaleWindowRecommendation({ cropName: qCrop, currentPrice: 2800, targetPrice: 3200 }),
      fetchRiskScore({ cropName: qCrop, transitDistanceKm: 35, spoilagePercent: 3.5 }),
      fetchRecommendationExplanation({ recommendationType: activeExplainType }),
      fetchPriceAlerts(),
    ]);

    setAssessments(assList);
    setStorageData(sData);
    setSaleWindowData(swData);
    setRiskData(rData);
    setExplanationData(expData);
    setPriceAlerts(alertList);
    setLoading(false);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusMessage('Creating automated target price alert configuration...');
      await createPriceAlertApi({
        commodity: qCrop,
        marketName: alertMarketName,
        targetPrice: alertTargetPrice,
      });
      setStatusMessage(`Automated price alert registered for ${qCrop} @ ₹${alertTargetPrice}/Qtl!`);
      const updatedAlerts = await fetchPriceAlerts();
      setPriceAlerts(updatedAlerts);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleToggleAlert = async (alertId: string, currentEnabled: boolean) => {
    try {
      await updatePriceAlertApi(alertId, { isEnabled: !currentEnabled });
      const updatedAlerts = await fetchPriceAlerts();
      setPriceAlerts(updatedAlerts);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deletePriceAlertApi(alertId);
      const updatedAlerts = await fetchPriceAlerts();
      setPriceAlerts(updatedAlerts);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleAssessQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusMessage('Evaluating deterministic crop quality scores...');
      const created = await createQualityAssessmentApi({
        cropName: qCrop,
        variety: qVariety,
        sizeScore: qSize,
        colorScore: qColor,
        firmnessScore: qFirmness,
        moisturePercent: qMoisture,
        visibleDamagePercent: qDamage,
        decayPercent: qDecay,
      });
      setLatestAssessment(created);
      setStatusMessage(`Assessed Quality Grade: PRISMS ${created.estimatedGrade} (Score: ${created.overallScore}/100)`);
      const updatedList = await fetchUserAssessments();
      setAssessments(updatedList);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const loadExplanation = async (type: string) => {
    setActiveExplainType(type);
    const exp = await fetchRecommendationExplanation({
      recommendationType: type,
      marketName: 'Lasalgaon APMC',
      buyerName: 'Nashik Agro Processors',
      netRealization: 96210,
      pricePerQtl: 3200,
      distanceKm: 25,
    });
    setExplanationData(exp);
  };
  const qLabels = (() => {
    const c = qCrop.toLowerCase();
    if (c.includes('onion')) {
      return {
        firmness: 'Bulb Firmness (0–100)',
        size: 'Size Uniformity (0–100)',
        color: 'Color / Skin Appearance (0–100)',
        moisture: 'Moisture Content (%)',
        damage: 'Visible Surface Damage (%)',
        decay: 'Decay / Rot (%)',
      };
    }
    if (c.includes('tomato')) {
      return {
        firmness: 'Fruit Firmness (0–100)',
        size: 'Size & Caliper Uniformity (0–100)',
        color: 'Color & Ripeness Stage (0–100)',
        moisture: 'Moisture Content (%)',
        damage: 'Crack & Surface Damage (%)',
        decay: 'Decay / Rot (%)',
      };
    }
    if (c.includes('wheat')) {
      return {
        firmness: 'Grain Hardness (0–100)',
        size: 'Kernel Size Uniformity (0–100)',
        color: 'Color & Glume Appearance (0–100)',
        moisture: 'Moisture Content (%)',
        damage: 'Foreign Matter / Impurity (%)',
        decay: 'Insect Damage (%)',
      };
    }
    if (c.includes('banana')) {
      return {
        firmness: 'Finger Firmness (0–100)',
        size: 'Length / Caliper Uniformity (0–100)',
        color: 'Skin Color / Ripeness (0–100)',
        moisture: 'Moisture Content (%)',
        damage: 'Bruising & Surface Damage (%)',
        decay: 'Decay / Rot (%)',
      };
    }
    return {
      firmness: 'Produce Firmness (0–100)',
      size: 'Size Uniformity (0–100)',
      color: 'Color & Appearance (0–100)',
      moisture: 'Moisture Content (%)',
      damage: 'Visible Damage (%)',
      decay: 'Decay / Rot (%)',
    };
  })();

  const EXPLAIN_TABS: { key: string; label: string }[] = [
    { key: 'WHY_THIS_BUYER', label: 'Why This Buyer' },
    { key: 'WHY_THIS_MARKET', label: 'Why This Market' },
    { key: 'WHY_SELL_NOW', label: 'Why Sell Now' },
    { key: 'WHY_COLD_STORAGE', label: 'Why Cold Storage' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1 border border-emerald-200">
            <Zap className="w-3.5 h-3.5" />
            {lang === "mr" ? "स्मार्ट इंटेलिजन्स इंजिन" : "Smart Decision Intelligence Suite"}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {lang === "mr" ? "बाजार बुद्धिमत्ता व ॲनालिटिक्स" : "Market Intelligence & Predictive Analytics"}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {lang === "mr"
              ? "पिक विक्रीची वेळ, शीतगृह साठवणूक, जोखीम मूल्यांकन व भाव अलर्ट्स विश्लेषित करा."
              : "Deterministic decision algorithms for optimal sale timing, storage holding, risk profiling, and price alerts."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={qCrop}
            onChange={(e) => setQCrop(e.target.value)}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs focus:bg-white focus:border-emerald-600 cursor-pointer"
          >
            <option value="Red Onion">🧅 Red Onion (Nashik)</option>
            <option value="Tomato">🍅 Hybrid Tomato</option>
            <option value="Wheat">🌾 Sharbati Wheat</option>
            <option value="Banana">🍌 Cavendish Banana</option>
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl flex items-center justify-between shadow-sm">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Row 1: Sale Window + Storage + Risk Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sale Window Card */}
        {saleWindowData && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Planning Signal</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {saleWindowData.confidence || "Rule-based Estimate"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${saleWindowData.recommendation === 'SELL_NOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{saleWindowData.recommendation?.replace('_', ' ') || 'SELL NOW'}</div>
                  <div className="text-xs text-slate-600 font-medium">Target: ₹{saleWindowData.targetPrice}/Qtl</div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-700">
                {saleWindowData.reasons.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Planning Horizon: {saleWindowData.planningHorizon || '10–14 days'}</span>
              <VoiceSpeaker text={`Planning Signal: ${saleWindowData.recommendation}. ${saleWindowData.reasons.join('. ')}`} lang={lang} />
            </div>
          </div>
        )}

        {/* Storage Recommendation Card */}
        {storageData && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Storage Recommendation</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Ambient & Thermal Model
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Warehouse className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{storageData.recommendedAction?.replace('_', ' ') || 'HOLD IN STORAGE'}</div>
                  <div className="text-xs text-slate-600 font-medium">Est. Cost: ₹{storageData.estimatedStorageCostPerMonth || 45}/Qtl/mo</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Max Hold Period:</span>
                  <span className="font-bold text-slate-900">{storageData.recommendedHoldDays ? `${storageData.recommendedHoldDays} Days` : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Est. Price Gain:</span>
                  <span className="font-bold text-emerald-700">{storageData.expectedPriceGain ? `+₹${storageData.expectedPriceGain}/Qtl` : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Spoilage Risk:</span>
                  <span className="font-bold text-amber-700">{storageData.spoilageRiskPercent !== undefined ? `${storageData.spoilageRiskPercent}%` : "Not available"}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Storage Signal</span>
              <VoiceSpeaker text={`Storage Action: ${storageData.recommendedAction}. Max Hold: ${storageData.recommendedHoldDays} days.`} lang={lang} />
            </div>
          </div>
        )}

        {/* Risk Score Card */}
        {riskData && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Risk Assessment</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${riskData.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {riskData.riskLevel} RISK ({riskData.totalRiskScore}/100)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${riskData.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{riskData.riskLevel} Risk Profile</div>
                  <div className="text-xs text-slate-600 font-medium">Deterministic Multi-Factor Scoring</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Spoilage Risk:</span>
                  <span className="font-bold text-slate-900">{riskData.spoilageRiskPercent !== undefined ? `${riskData.spoilageRiskPercent}%` : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Transit Distance Risk:</span>
                  <span className="font-bold text-slate-900">{riskData.transitDistanceKm !== undefined ? `${riskData.transitDistanceKm} km` : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Market Volatility Risk:</span>
                  <span className="font-bold text-slate-900">{riskData.marketVolatilityPercent !== undefined ? `${riskData.marketVolatilityPercent}%` : "Volatility data unavailable"}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-700 font-bold">Overall Risk Score:</span>
                  <span className={`font-extrabold ${riskData.riskLevel === 'HIGH' ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {riskData.totalRiskScore}/100 ({riskData.riskLevel})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Deterministic Math</span>
              <VoiceSpeaker text={`Risk score for ${riskData.cropName} is ${riskData.riskLevel} with score ${riskData.totalRiskScore} out of 100.`} lang={lang} />
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Crop Quality Assessor Form + Explainable AI Rationale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crop Quality Assessor Form (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Crop-Specific Quality Assessor
            </h3>
            <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-semibold">
              PRISMS Estimated Grade
            </span>
          </div>

          <form onSubmit={handleAssessQuality} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.firmness}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={qFirmness}
                  onChange={e => setQFirmness(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.size}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={qSize}
                  onChange={e => setQSize(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.color}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={qColor}
                  onChange={e => setQColor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.moisture}</label>
                <input
                  type="number"
                  step="0.1"
                  value={qMoisture}
                  onChange={e => setQMoisture(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.damage}</label>
                <input
                  type="number"
                  step="0.1"
                  value={qDamage}
                  onChange={e => setQDamage(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{qLabels.decay}</label>
                <input
                  type="number"
                  step="0.1"
                  value={qDecay}
                  onChange={e => setQDecay(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" /> Calculate PRISMS Estimated Grade
            </button>
          </form>

          {latestAssessment && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-900 text-xs font-bold uppercase">PRISMS Estimated Grade</span>
                <span className="text-2xl font-extrabold text-amber-800">
                  Grade {latestAssessment.estimatedGrade} <span className="text-xs font-medium text-amber-900">({latestAssessment.overallScore}/100)</span>
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium">{latestAssessment.qualityNotes}</p>
            </div>
          )}
        </div>

        {/* Explainable AI Rationale (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Explainable AI — Decision Rationale
            </h3>
            <VoiceSpeaker
              text={explanationData ? `${explanationData.title}. ${explanationData.summary}. Positive factors: ${explanationData.positiveFactors.join('. ')}` : 'Explainable AI Decision Rationale'}
              lang={lang}
            />
          </div>

          {/* Explanation Type Switcher Buttons */}
          <div className="flex flex-wrap gap-2">
            {EXPLAIN_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => loadExplanation(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplainType === key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {explanationData && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{explanationData.title}</h4>
                <p className="text-slate-600 mt-1">{explanationData.summary}</p>
              </div>

              {/* Positive Factors */}
              <div className="space-y-2">
                <div className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">✓ Positive Drivers (Higher Net Return)</div>
                <div className="space-y-1.5">
                  {explanationData.positiveFactors.map((pf: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Factors */}
              <div className="space-y-2">
                <div className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">⚠ Trade-offs & Cost Factors</div>
                <div className="space-y-1.5">
                  {explanationData.negativeFactors.map((nf: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{nf}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <strong>Calculation Formula:</strong> {explanationData.calculationReference}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Automated Price Alerts Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Automated Background Price Alerts Configuration
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                5-Min Worker Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Set target price thresholds for your crops. The automated background worker periodically scans live Data.gov.in mandi records and notifies you when target prices are hit.
            </p>
          </div>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleCreateAlert} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Commodity</label>
            <input
              type="text"
              value={qCrop}
              onChange={e => setQCrop(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Target Price (₹/Qtl)</label>
            <input
              type="number"
              min="1"
              value={alertTargetPrice}
              onChange={e => setAlertTargetPrice(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" /> Register Target Price Alert
            </button>
          </div>
        </form>

        {/* Active Price Alerts Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Configured Target Price Alerts</h4>
          {priceAlerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
              No price alerts configured yet. Register a target price alert above to receive automatic background notifications.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceAlerts.map(alert => (
                <div key={alert.alertId} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{alert.commodity}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${alert.lastTriggeredAt ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                        {alert.lastTriggeredAt ? 'TRIGGERED' : 'MONITORING'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700">Target: <strong className="text-emerald-700 font-bold">₹{alert.targetPrice.toLocaleString('en-IN')}/Qtl</strong> ({(alert.condition || '').replace('_', ' ')})</div>
                    <div className="text-[11px] text-slate-500 font-medium">Market: {alert.marketName || 'Regional Mandi'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlert(alert.alertId, alert.isEnabled)}
                      className={`p-2 rounded-lg transition-colors ${alert.isEnabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'}`}
                      title={alert.isEnabled ? 'Alert Enabled' : 'Alert Disabled'}
                    >
                      {alert.isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={() => handleDeleteAlert(alert.alertId)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
