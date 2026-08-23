export interface QualityQuestionOption {
  value: string;
  label: string;
  score: number; // 0 - 100 normalization
}

export interface QualityQuestionConfig {
  id: string;
  parameterId: string;
  section: string;
  questionText: string;
  helpText?: string;
  inputType: 'SELECT' | 'NUMBER' | 'PERCENTAGE' | 'RADIO';
  options?: QualityQuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
  required: boolean;
  defaultEvidenceSource?: string;
}

export interface QualityParameterConfig {
  parameterId: string;
  name: string;
  unit: string;
  weight: number; // percentage (sum = 100)
  critical: boolean;
  criticalThreshold?: number; // e.g. max acceptable percentage before failure
  criticalMessage?: string;
  allowedEvidenceSources: string[];
}

export interface CropQualityConfig {
  cropName: string;
  aliases: string[];
  parameters: QualityParameterConfig[];
  questions: QualityQuestionConfig[];
  gradeRules: {
    grade: 'Grade A' | 'Grade B' | 'Grade C' | 'REVIEW';
    minScore: number;
    maxScore: number;
    description: string;
  }[];
}

export const EVIDENCE_CONFIDENCE_WEIGHTS: Record<string, number> = {
  'Lab/Test': 95,
  'Moisture/meter': 88,
  'Physical sample': 78,
  'Farmer observation': 62,
  'Estimated': 45,
};

export const ONION_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Red Onion',
  aliases: ['onion', 'red onion', 'garwa onion', 'pol onion', 'nashik onion'],
  parameters: [
    {
      parameterId: 'bulb_size_uniformity',
      name: 'Bulb Size & Uniformity',
      unit: 'Category',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'rot_disease',
      name: 'Rot / Disease',
      unit: '%',
      weight: 20,
      critical: true,
      criticalThreshold: 10,
      criticalMessage: 'Rot/disease level exceeds 10% critical threshold, posing high spoilage risk in storage/transit.',
      allowedEvidenceSources: ['Lab/Test', 'Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'sprouting',
      name: 'Sprouting',
      unit: '%',
      weight: 15,
      critical: true,
      criticalThreshold: 10,
      criticalMessage: 'Sprouting exceeds 10% critical threshold, reducing dormant shelf life.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'cuts_damage',
      name: 'Cuts & Mechanical Damage',
      unit: '%',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'neck_drying',
      name: 'Neck Drying (Curing)',
      unit: 'Condition',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Moisture/meter', 'Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'bulb_firmness',
      name: 'Bulb Firmness',
      unit: 'Texture',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'skin_condition',
      name: 'Skin Condition & Color',
      unit: 'Condition',
      weight: 8,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'foreign_matter',
      name: 'Foreign Matter / Soil Adherence',
      unit: '%',
      weight: 6,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'storage_condition',
      name: 'Storage Facility Condition',
      unit: 'Facility',
      weight: 6,
      critical: false,
      allowedEvidenceSources: ['Farmer observation', 'Estimated'],
    },
  ],
  questions: [
    // Step 1: Bulb Size & Uniformity
    {
      id: 'bulb_size',
      parameterId: 'bulb_size_uniformity',
      section: 'Bulb Size & Uniformity',
      questionText: 'What is the dominant bulb size in this harvest lot?',
      helpText: 'Measure cross-diameter across average sample bulbs.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Large (> 60mm)', label: 'Large (> 60mm) — Premium Export Grade', score: 100 },
        { value: 'Medium (40-60mm)', label: 'Medium (40–60mm) — High Domestic Standard', score: 90 },
        { value: 'Small (< 40mm)', label: 'Small (< 40mm) — Processing / Retail Grade', score: 70 },
      ],
    },
    {
      id: 'bulb_uniformity',
      parameterId: 'bulb_size_uniformity',
      section: 'Bulb Size & Uniformity',
      questionText: 'How uniform is the bulb size across the batch?',
      helpText: 'Uniform lots fetch higher commercial prices at wholesale hubs.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Uniform', label: 'Uniform (over 85% same size grade)', score: 100 },
        { value: 'Mostly Uniform', label: 'Mostly Uniform (70–85% same size)', score: 85 },
        { value: 'Mixed', label: 'Mixed / Unsorted Lot', score: 65 },
      ],
    },

    // Step 2: Disease, Rot & Sprouting
    {
      id: 'rot_disease_percent',
      parameterId: 'rot_disease',
      section: 'Damage & Disease',
      questionText: 'Visible Rot / Fungal / Bacterial Disease Percentage (%)',
      helpText: 'Count affected bulbs in a 100-bulb sample. Above 10% is a critical defect.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'sprouting_percent',
      parameterId: 'sprouting',
      section: 'Damage & Disease',
      questionText: 'Visible Sprouting Percentage (%)',
      helpText: 'Count sprouted bulbs. Above 10% severely reduces storage capability.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'cuts_damage_percent',
      parameterId: 'cuts_damage',
      section: 'Damage & Disease',
      questionText: 'Harvest Cuts / Mechanical Bruising Percentage (%)',
      helpText: 'Bulbs with deep cuts or harvesting wounds.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },

    // Step 3: Drying, Firmness & Skin Condition
    {
      id: 'neck_drying',
      parameterId: 'neck_drying',
      section: 'Curing & Texture',
      questionText: 'Neck Drying & Curing Status',
      helpText: 'Well-cured thin dry necks prevent fungal pathogens during transport.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Well Dried', label: 'Well Dried (Tight, thin, fully cured neck)', score: 100 },
        { value: 'Partly Dried', label: 'Partly Dried (Slightly thick or moist neck)', score: 70 },
        { value: 'Wet / Green', label: 'Wet / Green Neck (Freshly pulled, uncured)', score: 35 },
      ],
    },
    {
      id: 'bulb_firmness',
      parameterId: 'bulb_firmness',
      section: 'Curing & Texture',
      questionText: 'Bulb Firmness & Density',
      helpText: 'Apply moderate thumb pressure on the shoulder of the bulb.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Firm', label: 'Firm & Solid (Solid resistance, no sponge)', score: 100 },
        { value: 'Slightly Soft', label: 'Slightly Soft / Spongy', score: 65 },
        { value: 'Soft', label: 'Soft / Pithy (Lacks solid structure)', score: 25 },
      ],
    },
    {
      id: 'skin_condition',
      parameterId: 'skin_condition',
      section: 'Curing & Texture',
      questionText: 'Outer Skin Condition & Scales',
      helpText: 'Dry outer scales protect against moisture loss.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Intact', label: 'Intact (2–3 tight unbroken dry scales, deep color)', score: 100 },
        { value: 'Minor Defects', label: 'Minor Defects (Partial skin peeling, slight discoloration)', score: 75 },
        { value: 'Damaged', label: 'Damaged / Exposed Flesh (Heavy peeling)', score: 40 },
      ],
    },

    // Step 4: Storage & Cleanliness
    {
      id: 'foreign_matter_percent',
      parameterId: 'foreign_matter',
      section: 'Storage & Cleanliness',
      questionText: 'Foreign Matter / Soil Clods Percentage (%)',
      helpText: 'Percentage weight of soil, dry roots, or loose field debris.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'storage_condition',
      parameterId: 'storage_condition',
      section: 'Storage & Cleanliness',
      questionText: 'Current Storage Facility Environment',
      helpText: 'Storage environment directly impacts post-harvest stability.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Farmer observation',
      options: [
        { value: 'Dry Ventilated Shed', label: 'Kanda Chawl / Raised Slotted Ventilated Shed', score: 100 },
        { value: 'Cold Storage', label: 'Controlled Atmosphere / Cold Storage', score: 90 },
        { value: 'Open Covered Shade', label: 'Covered Veranda / Shade Netting', score: 60 },
        { value: 'Open Ground', label: 'Open Field / Tarpaulin Floor', score: 30 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Premium Commercial / Export Grade with high uniformity and minimal defects.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Good Commercial Grade suitable for standard wholesale and retail distribution.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Fair Average Quality (FAQ) standard for processing or immediate consumption.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'Below standard specification or triggered critical quality failure limits.' },
  ],
};

export const CROP_CONFIGS: Record<string, CropQualityConfig> = {
  onion: ONION_QUALITY_CONFIG,
  'red onion': ONION_QUALITY_CONFIG,
};

export function getQualityConfigForCrop(cropName: string): CropQualityConfig {
  const normalized = (cropName || '').toLowerCase().trim();
  if (CROP_CONFIGS[normalized]) return CROP_CONFIGS[normalized];

  for (const config of Object.values(CROP_CONFIGS)) {
    if (config.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return config;
    }
  }

  // Generic fallback config for other crops
  return {
    ...ONION_QUALITY_CONFIG,
    cropName: cropName || 'General Produce',
    aliases: [normalized],
  };
}
