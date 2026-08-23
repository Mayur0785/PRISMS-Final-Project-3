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
    bulbSize?: string;
    rotPercent?: number;
    sproutingPercent?: number;
    cutsPercent?: number;
    neckDrying?: string;
    firmness?: string;
    skinCondition?: string;
    foreignMatterPercent?: number;
    storageCondition?: string;
    verificationStatus: string;
    disclaimer: string;
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
          const numVal = Math.max(0, Math.min(100, Number(ans.value)));
          paramValue = numVal;

          if (param.parameterId === 'rot_disease') {
            // Rot: <=1% -> 100, <=3% -> 85, <=5% -> 65, <=10% -> 40, >10% -> 0
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 85;
            else if (numVal <= 5) paramScore = 65;
            else if (numVal <= 10) paramScore = 40;
            else paramScore = 0;

            if (numVal > 10) {
              criticalFlags.push(`Critical: Rot/Disease level (${numVal}%) exceeds the 10% maximum permissible limit.`);
            }
          } else if (param.parameterId === 'sprouting') {
            // Sprouting: <=1% -> 100, <=3% -> 85, <=7% -> 60, <=10% -> 30, >10% -> 0
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 85;
            else if (numVal <= 7) paramScore = 60;
            else if (numVal <= 10) paramScore = 30;
            else paramScore = 0;

            if (numVal > 10) {
              criticalFlags.push(`Critical: Sprouting level (${numVal}%) exceeds the 10% maximum permissible storage threshold.`);
            }
          } else if (param.parameterId === 'cuts_damage') {
            // Cuts: <=2% -> 100, <=5% -> 80, <=10% -> 50, >10% -> 20
            if (numVal <= 2) paramScore = 100;
            else if (numVal <= 5) paramScore = 80;
            else if (numVal <= 10) paramScore = 50;
            else paramScore = Math.max(0, 100 - numVal * 5);
          } else if (param.parameterId === 'foreign_matter') {
            // Foreign Matter: <=1% -> 100, <=3% -> 80, <=6% -> 50, >6% -> 20
            if (numVal <= 1) paramScore = 100;
            else if (numVal <= 3) paramScore = 80;
            else if (numVal <= 6) paramScore = 50;
            else paramScore = Math.max(0, 100 - numVal * 10);
          } else {
            // Generic penalty
            paramScore = Math.max(0, 100 - numVal * 2);
          }
        } else if (q.options) {
          const matchedOpt = q.options.find((opt) => opt.value === ans.value);
          paramScore = matchedOpt ? matchedOpt.score : 70;
        }
      } else {
        // Missing measurement defaults to standard baseline rather than 100
        paramScore = 50;
        paramValue = 'Not measured';
        evidenceSource = 'Estimated';
      }
    } else if (paramQuestions.length > 1) {
      // Compound parameter, e.g. Bulb Size & Uniformity
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

  // Grade Determination
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
    positiveFactors.push('Standard fair quality across measured parameters');
  }
  if (riskFactors.length === 0) {
    riskFactors.push('Minimal post-harvest risk detected under current parameters');
  }

  const bulbSizeAns = answersMap.get('bulb_size')?.value;
  const uniformityAns = answersMap.get('bulb_uniformity')?.value;
  const bulbSizeCombined = bulbSizeAns && uniformityAns ? `${bulbSizeAns} / ${uniformityAns}` : (bulbSizeAns as string) || 'Medium';

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
      bulbSize: String(bulbSizeCombined),
      rotPercent: Number(answersMap.get('rot_disease_percent')?.value ?? 0),
      sproutingPercent: Number(answersMap.get('sprouting_percent')?.value ?? 0),
      cutsPercent: Number(answersMap.get('cuts_damage_percent')?.value ?? 0),
      neckDrying: String(answersMap.get('neck_drying')?.value ?? 'Well Dried'),
      firmness: String(answersMap.get('bulb_firmness')?.value ?? 'Firm'),
      skinCondition: String(answersMap.get('skin_condition')?.value ?? 'Intact'),
      foreignMatterPercent: Number(answersMap.get('foreign_matter_percent')?.value ?? 0),
      storageCondition: String(answersMap.get('storage_condition')?.value ?? 'Dry Ventilated Shed'),
      verificationStatus: 'Provisional — Farmer Declared',
      disclaimer: 'Assessment is provisional and based on farmer-submitted evidence. Verification may occur at hub inspection.',
    },
  };
}
