import React, { useState, useEffect } from "react";
import {
  fetchQualityQuestionsApi,
  submitQualityAssessmentApi,
  type CropQualityQuestionsResponse,
  type QualityQuestionConfig,
  type QualityAssessmentAnswer,
  type QualityAssessmentResult,
} from "@/lib/prisms";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Info,
  Layers,
  FileCheck,
} from "lucide-react";

interface QualityAssessmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string;
  variety?: string;
  cropBatchId?: string;
  onAssessmentCompleted: (result: QualityAssessmentResult) => void;
  onConfirmAndCreate?: (result: QualityAssessmentResult) => Promise<void>;
  lang?: "en" | "mr";
}

export function QualityAssessmentWizard({
  isOpen,
  onClose,
  cropName,
  variety,
  cropBatchId,
  onAssessmentCompleted,
  onConfirmAndCreate,
  lang = "en",
}: QualityAssessmentWizardProps) {
  const [config, setConfig] = useState<CropQualityQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, { value: any; evidenceSource: string }>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<QualityAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Lock background body scroll while wizard is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadQuestions() {
      setLoading(true);
      setErrorMsg("");
      setEvaluationResult(null);
      setCurrentStep(0);

      const res = await fetchQualityQuestionsApi(cropName || "Red Onion");
      if (res) {
        setConfig(res);

        // Pre-populate sensible defaults
        const initialAnswers: Record<string, { value: any; evidenceSource: string }> = {};
        for (const q of res.questions) {
          let defaultVal: any = "";
          if (q.inputType === "PERCENTAGE" || q.inputType === "NUMBER") {
            defaultVal = 0;
          } else if (q.options && q.options.length > 0) {
            defaultVal = q.options[0].value;
          }
          initialAnswers[q.id] = {
            value: defaultVal,
            evidenceSource: q.defaultEvidenceSource || "Physical sample",
          };
        }
        setAnswers(initialAnswers);
      }
      setLoading(false);
    }

    loadQuestions();
  }, [isOpen, cropName]);

  if (!isOpen) return null;

  // Group questions by section
  const sections = config
    ? Array.from(new Set(config.questions.map((q) => q.section)))
    : [];

  const currentSectionName = sections[currentStep] || "Assessment Details";
  const currentQuestions = config
    ? config.questions.filter((q) => q.section === currentSectionName)
    : [];

  const handleValueChange = (questionId: string, val: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        value: val,
      },
    }));
  };

  const handleEvidenceChange = (questionId: string, src: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        evidenceSource: src,
      },
    }));
  };

  const handleNext = () => {
    setErrorMsg("");
    // Validate current step questions
    for (const q of currentQuestions) {
      const val = answers[q.id]?.value;
      if (q.required && (val === undefined || val === null || val === "")) {
        setErrorMsg(`Please answer: "${q.questionText}"`);
        return;
      }
      if (q.inputType === "PERCENTAGE" || q.inputType === "NUMBER") {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100) {
          setErrorMsg(`Please enter a valid percentage (0–100) for "${q.questionText}"`);
          return;
        }
      }
    }

    if (currentStep < sections.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step -> submit assessment to backend engine
      handleSubmitEvaluation();
    }
  };

  const handlePrev = () => {
    setErrorMsg("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!config) return;
    setEvaluating(true);
    setErrorMsg("");

    try {
      const answersPayload: QualityAssessmentAnswer[] = config.questions.map((q) => {
        const item = answers[q.id];
        return {
          questionId: q.id,
          parameterId: q.parameterId,
          value: item ? item.value : 0,
          evidenceSource: item ? item.evidenceSource : "Physical sample",
        };
      });

      const res = await submitQualityAssessmentApi({
        cropName,
        variety: variety || "Garwa",
        cropBatchId,
        answers: answersPayload,
      });

      if (res) {
        setEvaluationResult(res);
      } else {
        setErrorMsg("Failed to calculate quality assessment. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit assessment.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleConfirmPassport = async () => {
    if (evaluationResult) {
      if (onConfirmAndCreate) {
        await onConfirmAndCreate(evaluationResult);
      } else {
        onAssessmentCompleted(evaluationResult);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Full Viewport Dark/Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sharp, Centered Wizard Card */}
      <div
        className="relative z-[110] bg-white rounded-3xl border border-slate-200/90 max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/30 animate-in zoom-in-95 max-h-[88vh] overflow-y-auto flex flex-col justify-between text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                {lang === "mr" ? "पिक गुणवत्ता मूल्यांकन (Crop Quality Assessment)" : "Crop Quality Assessment"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {cropName} {variety ? `• ${variety}` : ""} • Dynamic Quality Scoring Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                1. Lot Details
              </span>
              <span className="text-slate-300 font-bold">→</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white shadow-xs">
                2. Quality Assessment
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Close Quality Assessment"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold">Loading quality criteria for {cropName}...</p>
          </div>
        )}

        {/* Evaluation Result View (Quality Passport Preview) */}
        {!loading && evaluationResult && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Assessment Complete
                </span>
                <h4 className="text-lg font-black text-emerald-900">
                  {evaluationResult.provisionalGrade}
                </h4>
                <p className="text-xs text-emerald-800">
                  Quality Score: <span className="font-bold">{evaluationResult.qualityScore}/100</span> • Confidence:{" "}
                  <span className="font-bold">{evaluationResult.evidenceConfidence}%</span>
                </p>
              </div>
              <span className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
                <FileCheck className="w-6 h-6" />
              </span>
            </div>

            {/* Critical Flags (if any) */}
            {evaluationResult.criticalFlags && evaluationResult.criticalFlags.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Quality Warnings Triggered:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {evaluationResult.criticalFlags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths & Risks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-emerald-800 block text-[11px]">Top Quality Strengths</span>
                <ul className="space-y-1 text-[10px] text-slate-700">
                  {(evaluationResult.positiveFactors || []).map((p, i) => (
                    <li key={i}>✓ {p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-amber-900 block text-[11px]">Risk Considerations</span>
                <ul className="space-y-1 text-[10px] text-slate-700">
                  {(evaluationResult.riskFactors || []).map((r, i) => (
                    <li key={i}>⚠ {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Provisional Disclaimer */}
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              * Assessment is provisional and based on farmer-submitted measurements. Quality Passport will be attached to
              your trade lot.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setEvaluationResult(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ← Edit Answers
              </button>

              <button
                onClick={handleConfirmPassport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Attach Passport & Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step-by-Step Questionnaire Form */}
        {!loading && !evaluationResult && config && (
          <div className="space-y-5">
            {/* Step Progress Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>
                  Step {currentStep + 1} of {sections.length}: {currentSectionName}
                </span>
                <span>{Math.round(((currentStep + 1) / sections.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {currentQuestions.map((q) => {
                const currentAnswer = answers[q.id] || { value: "", evidenceSource: "Physical sample" };

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 transition-all text-xs"
                  >
                    <div>
                      <label className="font-extrabold text-slate-900 block text-xs">
                        {q.questionText} {q.required && <span className="text-red-500">*</span>}
                      </label>
                      {q.helpText && <p className="text-[11px] text-slate-500 mt-0.5">{q.helpText}</p>}
                    </div>

                    {/* SELECT / RADIO Input */}
                    {q.inputType === "SELECT" && q.options && (
                      <div className="grid grid-cols-1 gap-1.5">
                        {q.options.map((opt) => (
                          <label
                            key={opt.value}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              currentAnswer.value === opt.value
                                ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-xs">{opt.label}</span>
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.value}
                              checked={currentAnswer.value === opt.value}
                              onChange={(e) => handleValueChange(q.id, e.target.value)}
                              className="w-4 h-4 text-emerald-600 accent-emerald-600"
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    {/* PERCENTAGE / NUMBER Input */}
                    {(q.inputType === "PERCENTAGE" || q.inputType === "NUMBER") && (
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={q.min ?? 0}
                            max={q.max ?? 100}
                            value={currentAnswer.value}
                            onChange={(e) => handleValueChange(q.id, Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                          {q.unit && (
                            <span className="absolute right-3 top-2 text-xs font-extrabold text-slate-400">
                              {q.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evidence Source Selector */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                      <span className="text-slate-500 font-semibold">Evidence Source:</span>
                      <select
                        value={currentAnswer.evidenceSource}
                        onChange={(e) => handleEvidenceChange(q.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold focus:outline-none text-[10px] cursor-pointer"
                      >
                        <option value="Physical sample">Physical sample (78% confidence)</option>
                        <option value="Farmer observation">Farmer observation (62% confidence)</option>
                        <option value="Moisture/meter">Moisture/meter (88% confidence)</option>
                        <option value="Lab/Test">Lab/Test Certified (95% confidence)</option>
                        <option value="Estimated">Estimated (45% confidence)</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 font-bold text-xs text-slate-700 transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={evaluating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{currentStep === sections.length - 1 ? "Generate Quality Passport" : "Continue"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
