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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
      setCurrentQuestionIndex(0);

      const res = await fetchQualityQuestionsApi(cropName || "Red Onion");
      if (res && res.questions && res.questions.length > 0) {
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

  const totalQuestions = config?.questions.length || 0;
  const currentQuestion: QualityQuestionConfig | undefined = config?.questions[currentQuestionIndex];

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
    if (!currentQuestion) return;

    const val = answers[currentQuestion.id]?.value;
    if (currentQuestion.required && (val === undefined || val === null || val === "")) {
      setErrorMsg(lang === "mr" ? "कृपया या प्रश्नाचे उत्तर निवडा किंवा प्रविष्ट करा." : "Please answer this question to proceed.");
      return;
    }
    if (currentQuestion.inputType === "PERCENTAGE" || currentQuestion.inputType === "NUMBER") {
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) {
        setErrorMsg(lang === "mr" ? "कृपया वैध संख्या किंवा टक्केवारी (०-१००) प्रविष्ट करा." : "Please enter a valid percentage (0–100).");
        return;
      }
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmitEvaluation();
    }
  };

  const handlePrev = () => {
    setErrorMsg("");
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
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
        variety: variety || "Standard",
        cropBatchId,
        answers: answersPayload,
      });

      if (res) {
        setEvaluationResult(res);
      } else {
        setErrorMsg(lang === "mr" ? "गुणवत्ता विश्लेषण अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा." : "Failed to calculate quality assessment. Please try again.");
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
        className="relative z-[110] bg-white rounded-3xl border border-slate-200 max-w-xl sm:max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/30 animate-in zoom-in-95 max-h-[88vh] overflow-y-auto flex flex-col justify-between text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-serif font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                {lang === "mr" ? "पिक गुणवत्ता मूल्यांकन (Quality Assessment)" : "Crop Quality Assessment"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {cropName} {variety ? `• ${variety}` : ""} • Dynamic Crop-Specific Engine
              </p>
            </div>
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

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold">
              {lang === "mr" ? `${cropName} साठी गुणवत्ता निकष लोड होत आहेत...` : `Loading quality criteria for ${cropName}...`}
            </p>
          </div>
        )}

        {/* Evaluation Result View (Quality Passport Preview) */}
        {!loading && evaluationResult && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  {lang === "mr" ? "मूल्यांकन पूर्ण" : "Assessment Complete"}
                </span>
                <h4 className="text-xl font-black text-emerald-900 font-serif">
                  {evaluationResult.provisionalGrade}
                </h4>
                <p className="text-xs text-emerald-800">
                  Quality Score: <span className="font-bold">{evaluationResult.qualityScore}/100</span> • Evidence Confidence:{" "}
                  <span className="font-bold">{evaluationResult.evidenceConfidence}%</span>
                </p>
              </div>
              <span className="p-3 bg-emerald-700 text-white rounded-2xl shadow-sm">
                <FileCheck className="w-6 h-6" />
              </span>
            </div>

            {/* Critical Flags (if any) */}
            {evaluationResult.criticalFlags && evaluationResult.criticalFlags.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{lang === "mr" ? "गुणवत्ता सतर्कता (Quality Flags):" : "Quality Warnings Triggered:"}</span>
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-emerald-800 block text-[11px]">
                  {lang === "mr" ? "प्रमुख जमेच्या बाजू (Strengths)" : "Top Quality Strengths"}
                </span>
                <ul className="space-y-1 text-[10px] text-slate-700">
                  {(evaluationResult.positiveFactors || []).map((p, i) => (
                    <li key={i}>✓ {p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-amber-900 block text-[11px]">
                  {lang === "mr" ? "जोखीम घटक (Risk Factors)" : "Risk Considerations"}
                </span>
                <ul className="space-y-1 text-[10px] text-slate-700">
                  {(evaluationResult.riskFactors || []).map((r, i) => (
                    <li key={i}>⚠ {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Provisional Disclaimer */}
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              * Provisional — Farmer Declared. Quality Passport will be attached to your trade lot for buyers to review.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setEvaluationResult(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {lang === "mr" ? "← उत्तरे बदला" : "← Edit Answers"}
              </button>

              <button
                type="button"
                onClick={handleConfirmPassport}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>{lang === "mr" ? "पासपोर्ट संलग्न करा व सुरू ठेवा" : "Attach Passport & Continue"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ONE QUESTION AT A TIME Questionnaire Form */}
        {!loading && !evaluationResult && currentQuestion && (
          <div className="space-y-6">
            {/* Progress Bar & Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-600">
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === "mr" ? `प्रश्न ${currentQuestionIndex + 1} / ${totalQuestions}` : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
                </span>
                <span className="text-slate-400 font-medium">
                  {currentQuestion.section} ({Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Single Question Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4 text-xs">
              <div>
                <label className="font-serif font-black text-slate-900 block text-base sm:text-lg leading-snug">
                  {currentQuestion.questionText} {currentQuestion.required && <span className="text-emerald-600">*</span>}
                </label>
                {currentQuestion.helpText && (
                  <p className="text-xs text-slate-500 mt-1">{currentQuestion.helpText}</p>
                )}
              </div>

              {/* SELECT / RADIO Options */}
              {currentQuestion.inputType === "SELECT" && currentQuestion.options && (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = answers[currentQuestion.id]?.value === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80"
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{opt.label}</span>
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={opt.value}
                          checked={isSelected}
                          onChange={(e) => handleValueChange(currentQuestion.id, e.target.value)}
                          className="w-4 h-4 text-emerald-700 accent-emerald-700"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {/* PERCENTAGE / NUMBER Input */}
              {(currentQuestion.inputType === "PERCENTAGE" || currentQuestion.inputType === "NUMBER") && (
                <div className="pt-2">
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min={currentQuestion.min ?? 0}
                      max={currentQuestion.max ?? 100}
                      value={answers[currentQuestion.id]?.value ?? 0}
                      onChange={(e) => handleValueChange(currentQuestion.id, Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                      placeholder="0"
                    />
                    {currentQuestion.unit && (
                      <span className="absolute right-3.5 top-3 text-xs font-black text-slate-400">
                        {currentQuestion.unit}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Evidence Source Selector */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200/80 text-[11px] gap-2">
                <span className="text-slate-500 font-medium">Evidence Source:</span>
                <select
                  value={answers[currentQuestion.id]?.evidenceSource || "Physical sample"}
                  onChange={(e) => handleEvidenceChange(currentQuestion.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold focus:outline-none text-[11px] cursor-pointer"
                >
                  <option value="Physical sample">Physical sample (78% confidence)</option>
                  <option value="Farmer observation">Farmer observation (62% confidence)</option>
                  <option value="Moisture/meter">Moisture meter test (88% confidence)</option>
                  <option value="Lab/Test">Certified Lab Assay (95% confidence)</option>
                  <option value="Estimated">Estimated (45% confidence)</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 font-bold text-xs text-slate-700 transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === "mr" ? "मागे (Back)" : "Back"}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={evaluating}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span>
                  {evaluating
                    ? lang === "mr" ? "गणना करत आहे..." : "Calculating Quality..."
                    : currentQuestionIndex === totalQuestions - 1
                    ? lang === "mr" ? "गुणवत्ता मोजा (Calculate Quality)" : "Calculate Quality"
                    : lang === "mr" ? "पुढे (Next)" : "Next"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
