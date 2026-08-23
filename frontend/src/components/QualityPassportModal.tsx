import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Percent,
  Layers,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { QualityAssessmentResult } from "@/lib/prisms";

interface QualityPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: QualityAssessmentResult | null;
  lotId?: string;
  onMakeOffer?: () => void;
}

export function QualityPassportModal({
  isOpen,
  onClose,
  assessment,
  lotId,
  onMakeOffer,
}: QualityPassportModalProps) {
  if (!isOpen || !assessment) return null;

  const summary = assessment.passportSummary || (assessment as any).evaluation?.passportSummary || {};
  const isHighQuality = (assessment.qualityScore || 85) >= 85;
  const grade = assessment.provisionalGrade || "Grade A";
  const confidence = assessment.evidenceConfidence || 80;
  const score = assessment.qualityScore || 85;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                  PRISMS Quality Passport
                  <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Provisional
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {summary.crop || assessment.cropName} • {lotId ? `Lot ${lotId}` : `ID: ${assessment.assessmentId}`}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Badges & Score Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Grade Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Provisional Grade
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{grade}</span>
              <span className="text-[10px] text-slate-400 font-medium">Farmer Declared</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Subject to physical hub verification upon delivery.
            </p>
          </div>

          {/* Quality Score */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              Quality Score
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-900">{score}</span>
              <span className="text-xs font-bold text-emerald-700">/ 100</span>
            </div>
            <div className="w-full bg-emerald-200/70 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Evidence Confidence */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1">
            <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center justify-between">
              Evidence Confidence
              <Info className="w-3.5 h-3.5 text-blue-600" />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-900">{confidence}%</span>
            </div>
            <p className="text-[10px] text-blue-700 leading-tight font-medium">
              Based on sample physical checks & observation.
            </p>
          </div>
        </div>

        {/* Critical Flags Warning (if any) */}
        {assessment.criticalFlags && assessment.criticalFlags.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Critical Quality Limits Flagged</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] font-medium text-amber-800">
              {assessment.criticalFlags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Measured Quality Parameters Breakdown */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            Crop Quality Parameters & Measurements
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Bulb Size & Uniformity</span>
              <span className="font-black text-slate-800">{summary.bulbSize || "Large / Uniform"}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Rot / Disease</span>
              <span className="font-black text-slate-800">
                {summary.rotPercent !== undefined ? `${summary.rotPercent}%` : "0%"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Sprouting Defect</span>
              <span className="font-black text-slate-800">
                {summary.sproutingPercent !== undefined ? `${summary.sproutingPercent}%` : "0%"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Neck Drying Status</span>
              <span className="font-black text-slate-800">{summary.neckDrying || "Well Dried"}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Bulb Firmness</span>
              <span className="font-black text-slate-800">{summary.firmness || "Firm"}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Skin Condition</span>
              <span className="font-black text-slate-800">{summary.skinCondition || "Intact"}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Mechanical Cuts</span>
              <span className="font-black text-slate-800">
                {summary.cutsPercent !== undefined ? `${summary.cutsPercent}%` : "0%"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Foreign Matter / Soil</span>
              <span className="font-black text-slate-800">
                {summary.foreignMatterPercent !== undefined ? `${summary.foreignMatterPercent}%` : "0%"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Storage Facility</span>
              <span className="font-black text-slate-800">{summary.storageCondition || "Ventilated Shed"}</span>
            </div>
          </div>
        </div>

        {/* Positive Factors & Risk Considerations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Strengths */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2 text-xs">
            <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Positive Quality Factors
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
              {(assessment.positiveFactors || []).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Factors */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2 text-xs">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Risk Considerations
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
              {(assessment.riskFactors || []).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Safety & Legal Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5 leading-relaxed">
          <p className="font-bold text-slate-700">Notice on Provisional Grading</p>
          <p>
            {summary.disclaimer ||
              "Assessment is provisional and based on farmer-submitted evidence. Final binding acceptance occurs at destination logistics inspection."}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-all cursor-pointer"
          >
            Close Passport
          </button>
          {onMakeOffer && (
            <button
              onClick={() => {
                onClose();
                onMakeOffer();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Submit Binding Offer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
