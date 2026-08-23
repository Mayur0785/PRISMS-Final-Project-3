import {
  CropQualityConfig,
  getQualityConfigForCrop,
  EVIDENCE_CONFIDENCE_WEIGHTS,
} from './qualityConfig';

export interface AnswerItem {
  questionId: string;
  parameterId: string;
  value: string | number;
  evidenceSource?: string;
}

export interface CalculatedQualityResult {
  cropName: string;
  qualityScore: number; // 0 - 100
  provisionalGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'REVIEW';
  evidenceConfidence: number; // 0 - 100 (%)
  criticalFlags: string[];
  positiveFactors: string[];
  riskFactors: string[];
  parameterScores: Record<
    string,
    {
      name: string;
      unit: string;
      weight: number;
      score: number;
      value: string | number;
      evidenceSource: string;
      evidenceConfidence: number;
      critical: boolean;
    }
  >;
  passportSummary: {
    crop: string;
    provisionalGrade: string;
    qualityScore: number;
    evidenceConfidence: number;
    parametersList: Array<{ name: string; value: string | number; unit: string; score: number }>;
    verificationStatus: string;
    disclaimer: string;
    [key: string]: any;
  };
}

export function evaluateLotQuality(
  cropName: string,
  answers: AnswerItem[]
): CalculatedQualityResult {
  const config = getQualityConfigForCrop(cropName);
  const answersMap = new Map<string, AnswerItem>(answers.map((a) => [a.questionId, a]));

  const parameterScores: CalculatedQualityResult['parameterScores'] = {};
  const criticalFlags: string[] = [];

  let totalWeightedScore = 0;
  let totalConfidenceWeighted = 0;
  let totalWeight = 0;

  // Process each parameter configured for this crop
  for (const param of config.parameters) {
    const paramQuestions = config.questions.filter((q) => q.parameterId === param.parameterId);
    let paramScore = 0;
    let paramValue: string | number = 'N/A';
    let evidenceSource = 'Physical sample';

    if (paramQuestions.length === 1) {
      const q = paramQuestions[0];
      const ans = answersMap.get(q.id);
      if (ans && ans.value !== undefined && ans.value !== null && ans.value !== '') {
        paramValue = ans.value;
        if (ans.evidenceSource) evidenceSource = ans.evidenceSource;

        if (q.inputType === 'PERCENTAGE' || q.inputType === 'NUMBER') {
          const numVal = Math.max(0, Number(ans.value));
          paramValue = numVal;

          // Crop-specific threshold calculations
          if (param.parameterId.includes('moisture')) {
            // Moisture: <=10% -> 100, <=12% -> 90, <=13% -> 75, <=14% -> 60, >14% -> 20
            if (numVal <= 10.5) paramScore = 100;
            else if (numVal <= 12.0) paramScore = 90;
            else if (numVal <= 13.0) paramScore = 75;
            else if (numVal <= 14.0) paramScore = 60;
            else paramScore = 20;

            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: Moisture level (${numVal}%) exceeds safe ${param.criticalThreshold}% storage limit.`);
            }
          } else if (param.parameterId.includes('rot') || param.parameterId.includes('disease')) {
            // Rot / Disease: <=1% -> 100, <=3% -> 85, <=5% -> 65, <=10% -> 40, >10% -> 0
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 85;
            else if (numVal <= 5) paramScore = 65;
            else if (numVal <= 10) paramScore = 40;
            else paramScore = 0;

            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: Rot/Disease (${numVal}%) exceeds ${param.criticalThreshold}% permissible threshold.`);
            }
          } else if (param.parameterId.includes('sprout')) {
            // Sprouting: <=1% -> 100, <=3% -> 85, <=7% -> 60, <=10% -> 30, >10% -> 0
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 85;
            else if (numVal <= 7) paramScore = 60;
            else if (numVal <= 10) paramScore = 30;
            else paramScore = 0;

            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: Sprouting (${numVal}%) exceeds ${param.criticalThreshold}% storage threshold.`);
            }
          } else if (param.parameterId.includes('weevil') || param.parameterId.includes('insect')) {
            // Weevil / Pest damage
            if (numVal <= 0.5) paramScore = 100;
            else if (numVal <= 1.5) paramScore = 85;
            else if (numVal <= 3.0) paramScore = 60;
            else paramScore = 15;

            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: Insect damage (${numVal}%) exceeds ${param.criticalThreshold}% standard.`);
            }
          } else if (param.parameterId.includes('green') || param.parameterId.includes('solanine')) {
            // Potato greening
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 80;
            else if (numVal <= 5) paramScore = 50;
            else paramScore = 10;

            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: Greening level (${numVal}%) exceeds ${param.criticalThreshold}%.`);
            }
          } else if (param.parameterId.includes('foreign')) {
            // Foreign matter
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 2.5) paramScore = 80;
            else if (numVal <= 5) paramScore = 55;
            else paramScore = Math.max(0, 100 - numVal * 10);
          } else if (param.parameterId.includes('broken') || param.parameterId.includes('split')) {
            // Broken grains / splits
            if (numVal <= 3) paramScore = 100;
            else if (numVal <= 7) paramScore = 85;
            else if (numVal <= 15) paramScore = 65;
            else paramScore = Math.max(0, 100 - numVal * 3);
          } else {
            // Generic percentage defect penalty
            paramScore = Math.max(0, Math.min(100, Math.round(100 - numVal * 2.5)));
            if (param.critical && param.criticalThreshold && numVal > param.criticalThreshold) {
              criticalFlags.push(param.criticalMessage || `Critical: ${param.name} (${numVal}%) exceeds permissible standard.`);
            }
          }
        } else if (q.options) {
          const matchedOpt = q.options.find((opt) => opt.value === ans.value);
          paramScore = matchedOpt ? matchedOpt.score : 70;

          if (param.critical && matchedOpt && matchedOpt.score < 40) {
            criticalFlags.push(param.criticalMessage || `Critical: ${param.name} condition (${matchedOpt.label}) triggered quality alert.`);
          }
        }
      } else {
        // Missing measurement defaults to standard baseline rather than 100
        paramScore = 55;
        paramValue = 'Not measured';
        evidenceSource = 'Estimated';
      }
    } else if (paramQuestions.length > 1) {
      // Compound parameter
      let sumScore = 0;
      const values: string[] = [];

      for (const q of paramQuestions) {
        const ans = answersMap.get(q.id);
        if (ans && ans.value) {
          values.push(String(ans.value));
          if (ans.evidenceSource) evidenceSource = ans.evidenceSource;
          if (q.options) {
            const matchedOpt = q.options.find((opt) => opt.value === ans.value);
            sumScore += matchedOpt ? matchedOpt.score : 70;
          }
        } else {
          sumScore += 60;
        }
      }
      paramScore = Math.round(sumScore / paramQuestions.length);
      paramValue = values.join(' • ') || 'Standard';
    }

    const evConfidence = EVIDENCE_CONFIDENCE_WEIGHTS[evidenceSource] || 60;

    parameterScores[param.parameterId] = {
      name: param.name,
      unit: param.unit,
      weight: param.weight,
      score: paramScore,
      value: paramValue,
      evidenceSource,
      evidenceConfidence: evConfidence,
      critical: param.critical,
    };

    totalWeightedScore += paramScore * param.weight;
    totalConfidenceWeighted += evConfidence * param.weight;
    totalWeight += param.weight;
  }

  const rawQualityScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 80;
  const overallConfidence = totalWeight > 0 ? Math.round(totalConfidenceWeighted / totalWeight) : 75;

  // Grade Determination from crop's gradeRules
  let provisionalGrade: 'Grade A' | 'Grade B' | 'Grade C' | 'REVIEW' = 'Grade B';
  if (rawQualityScore >= 90) provisionalGrade = 'Grade A';
  else if (rawQualityScore >= 75) provisionalGrade = 'Grade B';
  else if (rawQualityScore >= 60) provisionalGrade = 'Grade C';
  else provisionalGrade = 'REVIEW';

  // Critical limit overrides
  if (criticalFlags.length > 0) {
    if (provisionalGrade === 'Grade A' || provisionalGrade === 'Grade B') {
      provisionalGrade = 'REVIEW';
    }
  }

  // Positive Factors (Top 3 highest scores >= 80)
  const sortedParams = Object.values(parameterScores).sort((a, b) => b.score - a.score);
  const positiveFactors = sortedParams
    .filter((p) => p.score >= 80)
    .slice(0, 3)
    .map((p) => `${p.name}: ${p.value} (${p.score}/100)`);

  // Risk Factors (Lowest 3 scores < 80 or critical flags)
  const riskSortedParams = Object.values(parameterScores).sort((a, b) => a.score - b.score);
  const riskFactors = riskSortedParams
    .filter((p) => p.score < 80)
    .slice(0, 3)
    .map((p) => `${p.name}: ${p.value} (Score: ${p.score}/100)`);

  if (positiveFactors.length === 0) {
    positiveFactors.push('Standard commercial quality across evaluated parameters');
  }
  if (riskFactors.length === 0) {
    riskFactors.push('Minimal post-harvest defect risk detected');
  }

  const parametersList = Object.values(parameterScores).map((p) => ({
    name: p.name,
    value: p.value,
    unit: p.unit,
    score: p.score,
  }));

  return {
    cropName: config.cropName,
    qualityScore: rawQualityScore,
    provisionalGrade,
    evidenceConfidence: overallConfidence,
    criticalFlags,
    positiveFactors,
    riskFactors,
    parameterScores,
    passportSummary: {
      crop: config.cropName,
      provisionalGrade,
      qualityScore: rawQualityScore,
      evidenceConfidence: overallConfidence,
      parametersList,
      verificationStatus: 'Provisional — Farmer Declared',
      disclaimer: 'Assessment is provisional and based on farmer-submitted measurements. Verification may occur at hub inspection.',
    },
  };
}
