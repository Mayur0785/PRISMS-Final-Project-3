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

// ============================================================================
// 1. ONION QUALITY CONFIGURATION
// ============================================================================
export const ONION_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Red Onion',
  aliases: ['onion', 'red onion', 'garwa onion', 'pol onion', 'nashik onion', 'white onion'],
  parameters: [
    {
      parameterId: 'bulb_size',
      name: 'Predominant Bulb Size',
      unit: 'Category',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'bulb_uniformity',
      name: 'Bulb Size Uniformity',
      unit: 'Category',
      weight: 10,
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
      weight: 8,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation', 'Estimated'],
    },
    {
      parameterId: 'skin_condition',
      name: 'Skin Condition & Color',
      unit: 'Condition',
      weight: 6,
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
  ],
  questions: [
    {
      id: 'onion_bulb_size',
      parameterId: 'bulb_size',
      section: 'Size & Grading',
      questionText: 'What is the predominant bulb size in this harvest lot?',
      helpText: 'Measure cross-diameter across average sample bulbs.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Large (> 60mm)', label: 'Large (> 60mm) — Premium Export / Super Grade', score: 100 },
        { value: 'Medium (40-60mm)', label: 'Medium (40–60mm) — Standard Commercial Wholesale', score: 90 },
        { value: 'Small (< 40mm)', label: 'Small (< 40mm) — Retail / Processing Grade', score: 70 },
      ],
    },
    {
      id: 'onion_bulb_uniformity',
      parameterId: 'bulb_uniformity',
      section: 'Size & Grading',
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
    {
      id: 'onion_rot_percent',
      parameterId: 'rot_disease',
      section: 'Defects & Spoilage',
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
      id: 'onion_sprouting_percent',
      parameterId: 'sprouting',
      section: 'Defects & Spoilage',
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
      id: 'onion_cuts_percent',
      parameterId: 'cuts_damage',
      section: 'Defects & Spoilage',
      questionText: 'Harvest Cuts / Mechanical Bruising Percentage (%)',
      helpText: 'Percentage of bulbs with harvesting wounds or crushed layers.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'onion_neck_drying',
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
      id: 'onion_firmness',
      parameterId: 'bulb_firmness',
      section: 'Curing & Texture',
      questionText: 'Bulb Firmness & Density',
      helpText: 'Apply moderate thumb pressure on the shoulder of the bulb.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Firm & Solid', label: 'Firm & Solid (Solid resistance, no sponge)', score: 100 },
        { value: 'Slightly Soft', label: 'Slightly Soft / Spongy', score: 65 },
        { value: 'Soft / Pithy', label: 'Soft / Pithy (Lacks solid structure)', score: 25 },
      ],
    },
    {
      id: 'onion_skin_condition',
      parameterId: 'skin_condition',
      section: 'Skin & Appearance',
      questionText: 'Outer Skin Condition & Scales',
      helpText: 'Dry outer scales protect against moisture loss.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Intact & Tight', label: 'Intact (2–3 tight unbroken dry scales, deep color)', score: 100 },
        { value: 'Minor Peeling', label: 'Minor Defects (Partial skin peeling, slight discoloration)', score: 75 },
        { value: 'Damaged / Exposed', label: 'Damaged / Exposed Flesh (Heavy peeling)', score: 40 },
      ],
    },
    {
      id: 'onion_foreign_matter',
      parameterId: 'foreign_matter',
      section: 'Cleanliness',
      questionText: 'Foreign Matter / Soil Clods Percentage (%)',
      helpText: 'Percentage weight of soil, dry roots, or loose field debris.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Premium Commercial / Export Grade with high uniformity and minimal defects.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Good Commercial Grade suitable for standard wholesale and retail distribution.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Fair Average Quality (FAQ) standard for processing or immediate consumption.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'Below standard specification or triggered critical quality failure limits.' },
  ],
};

// ============================================================================
// 2. WHEAT QUALITY CONFIGURATION
// ============================================================================
export const WHEAT_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Wheat',
  aliases: ['wheat', 'sharbati wheat', 'durum wheat', 'lokwan wheat', 'gehun'],
  parameters: [
    {
      parameterId: 'moisture',
      name: 'Moisture Content',
      unit: '%',
      weight: 22,
      critical: true,
      criticalThreshold: 14,
      criticalMessage: 'Moisture exceeds 14.0% safe storage threshold, risking mould and heating in silos.',
      allowedEvidenceSources: ['Moisture/meter', 'Lab/Test', 'Physical sample', 'Estimated'],
    },
    {
      parameterId: 'foreign_matter',
      name: 'Foreign Matter (Inorganic/Organic)',
      unit: '%',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Lab/Test', 'Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'damaged_grains',
      name: 'Damaged / Discoloured Grains',
      unit: '%',
      weight: 18,
      critical: true,
      criticalThreshold: 6,
      criticalMessage: 'Damaged grains exceed 6.0%, impacting flour recovery and quality.',
      allowedEvidenceSources: ['Physical sample', 'Lab/Test', 'Farmer observation'],
    },
    {
      parameterId: 'weevil_damage',
      name: 'Weevilled / Insect Damaged Grains',
      unit: '%',
      weight: 15,
      critical: true,
      criticalThreshold: 3,
      criticalMessage: 'Weevil infestation exceeds 3.0%, indicating active pest damage.',
      allowedEvidenceSources: ['Physical sample', 'Lab/Test', 'Farmer observation'],
    },
    {
      parameterId: 'shrivelled_grains',
      name: 'Shrivelled / Immature Grains',
      unit: '%',
      weight: 12,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'grain_lustre',
      name: 'Grain Lustre & Colour Uniformity',
      unit: 'Category',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'odour_condition',
      name: 'Grain Odour & Cleanliness',
      unit: 'Condition',
      weight: 8,
      critical: true,
      criticalThreshold: 0,
      criticalMessage: 'Foul or musty odour detected, rendering grain unsuitable for premium milling.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
  ],
  questions: [
    {
      id: 'wheat_moisture',
      parameterId: 'moisture',
      section: 'Moisture & Physical Purity',
      questionText: 'Moisture Content Percentage (%)',
      helpText: 'Safe grain storage requires moisture under 12.0% (Max limit 14.0%).',
      inputType: 'NUMBER',
      min: 5,
      max: 25,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Moisture/meter',
    },
    {
      id: 'wheat_foreign_matter',
      parameterId: 'foreign_matter',
      section: 'Moisture & Physical Purity',
      questionText: 'Foreign Matter / Chaff / Stones Percentage (%)',
      helpText: 'Standard FAQ limit is 1.5% maximum.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 20,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'wheat_damaged_grains',
      parameterId: 'damaged_grains',
      section: 'Grain Health & Defects',
      questionText: 'Damaged, Broken & Discoloured Grains Percentage (%)',
      helpText: 'Includes fungal discolouration, germ damage, and broken kernels.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 50,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'wheat_weevil_damage',
      parameterId: 'weevil_damage',
      section: 'Grain Health & Defects',
      questionText: 'Weevil-Bored / Insect Damaged Grains Percentage (%)',
      helpText: 'Visible bore holes or live insect infestation. Over 3% triggers review.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 20,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'wheat_shrivelled',
      parameterId: 'shrivelled_grains',
      section: 'Grain Health & Defects',
      questionText: 'Shrivelled, Pinhead & Immature Grains (%)',
      helpText: 'Thin or underdeveloped grains reducing test weight.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 30,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'wheat_grain_lustre',
      parameterId: 'grain_lustre',
      section: 'Visual Appearance',
      questionText: 'Grain Colour, Lustre & Kernel Boldness',
      helpText: 'Bright golden amber kernels denote premium Sharbati/Lokwan milling quality.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Bold Amber Lustrous', label: 'Bold Amber Lustrous (Heavy test weight, shiny)', score: 100 },
        { value: 'Standard Medium Amber', label: 'Standard Medium Amber (Normal sheen)', score: 85 },
        { value: 'Dull / Bleached', label: 'Dull / Weather Damaged / Bleached', score: 55 },
      ],
    },
    {
      id: 'wheat_odour',
      parameterId: 'odour_condition',
      section: 'Visual Appearance',
      questionText: 'Grain Odour & Mould Condition',
      helpText: 'Must be sweet natural grain smell with zero mustiness or sourness.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Natural Sweet Grain Odour', label: 'Natural & Fresh (Free from foreign odours)', score: 100 },
        { value: 'Slight Stale Odour', label: 'Slightly Stale (Old harvest smell)', score: 65 },
        { value: 'Musty / Sour / Mouldy', label: 'Musty / Sour / Chemical (Unacceptable)', score: 10 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Premium Milling Grade Sharbati/Durum with low moisture (<11%) and high test weight.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Standard FAQ Milling Grade suitable for flour mills and food processors.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Commercial / Feed Grade with elevated broken or shrivelled grains.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'High moisture, insect infestation, or musty odour requiring reconditioning.' },
  ],
};

// ============================================================================
// 3. TOMATO QUALITY CONFIGURATION
// ============================================================================
export const TOMATO_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Tomato',
  aliases: ['tomato', 'hybrid tomato', 'table tomato', 'tamatar'],
  parameters: [
    {
      parameterId: 'ripeness_stage',
      name: 'Ripeness & Colour Stage',
      unit: 'Stage',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'fruit_firmness',
      name: 'Fruit Firmness & Wall Thickness',
      unit: 'Texture',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'cracking_bruising',
      name: 'Cracking & Mechanical Bruising',
      unit: '%',
      weight: 20,
      critical: true,
      criticalThreshold: 8,
      criticalMessage: 'Cracking and bruising exceeds 8.0%, accelerating bacterial leakage.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'pest_disease_spots',
      name: 'Pest Spots / Blight / Blossom End Rot',
      unit: '%',
      weight: 20,
      critical: true,
      criticalThreshold: 5,
      criticalMessage: 'Disease spots exceed 5.0%, rejecting table supermarket standards.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'size_uniformity',
      name: 'Fruit Size & Uniformity',
      unit: 'Category',
      weight: 12,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'cleanliness',
      name: 'Cleanliness & Stalk Condition',
      unit: 'Condition',
      weight: 8,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
  ],
  questions: [
    {
      id: 'tomato_ripeness',
      parameterId: 'ripeness_stage',
      section: 'Maturity & Appearance',
      questionText: 'Harvest Ripeness Stage',
      helpText: 'Breaker/Pink stages are optimal for long-distance transit; Red Ripe for local retail.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Breaker / Turning (10-30% pink)', label: 'Breaker / Turning (10–30% colour, 7-10 day shelf life)', score: 100 },
        { value: 'Pink / Light Red (30-60%)', label: 'Pink / Light Red (3–5 day transit)', score: 90 },
        { value: 'Full Red Ripe (> 90%)', label: 'Full Red Ripe (Immediate local market / processing)', score: 75 },
        { value: 'Overripe / Soft', label: 'Overripe / Mushy (High transit loss)', score: 30 },
      ],
    },
    {
      id: 'tomato_firmness',
      parameterId: 'fruit_firmness',
      section: 'Maturity & Appearance',
      questionText: 'Fruit Firmness & Wall Density',
      helpText: 'Firm hybrid tomatoes withstand multi-tier crate stacking.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Very Firm (Solid thick pericarp)', label: 'Very Firm (Solid thick walls, high pressure resistance)', score: 100 },
        { value: 'Moderately Firm', label: 'Moderately Firm (Standard retail)', score: 80 },
        { value: 'Soft / Yielding', label: 'Soft / Yielding to gentle finger touch', score: 40 },
      ],
    },
    {
      id: 'tomato_cracking',
      parameterId: 'cracking_bruising',
      section: 'Defects & Damage',
      questionText: 'Cracked, Split or Bruised Fruits Percentage (%)',
      helpText: 'Concentric growth cracks or transport pressure cuts.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'tomato_disease_spots',
      parameterId: 'pest_disease_spots',
      section: 'Defects & Damage',
      questionText: 'Blight, Fruit Borer Holes or Sunscald Percentage (%)',
      helpText: 'Visible spots, insect puncture holes, or watery lesions.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'tomato_size_uniformity',
      parameterId: 'size_uniformity',
      section: 'Grading & Sizing',
      questionText: 'Fruit Size & Caliber Uniformity',
      helpText: 'Even sizing in 20kg plastic crates fetches top buyer bids.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Uniform Grade A (65-80mm)', label: 'Uniform Large (65–80mm diameter, 85%+ uniform)', score: 100 },
        { value: 'Uniform Medium (50-65mm)', label: 'Uniform Medium (50–65mm diameter)', score: 90 },
        { value: 'Mixed Sizes', label: 'Mixed / Unsorted Sizes', score: 65 },
      ],
    },
    {
      id: 'tomato_cleanliness',
      parameterId: 'cleanliness',
      section: 'Grading & Sizing',
      questionText: 'Calyx & Skin Cleanliness',
      helpText: 'Fresh green calyx and dust-free skin indicate gentle handling.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Clean with Fresh Green Calyx', label: 'Clean with Fresh Green Calyx (No chemical residues)', score: 100 },
        { value: 'Stalk Removed / Clean Skin', label: 'Clean Skin (Stalks naturally detached)', score: 85 },
        { value: 'Dusty / Water Stained', label: 'Dusty / Field Mud / Spray Residues', score: 60 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Supermarket Table Grade with high firmness, uniform breaker stage, zero blight.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Wholesale Mandi Grade suitable for interstate truck transport and standard retail.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Processing / Ketchup Grade with ripe fruit or minor skin blemishes.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'High cracking or pest punctures exceeding safe commercial threshold.' },
  ],
};

// ============================================================================
// 4. SOYBEAN QUALITY CONFIGURATION
// ============================================================================
export const SOYBEAN_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Soybean',
  aliases: ['soybean', 'yellow soybeans', 'soyabean', 'js-335'],
  parameters: [
    {
      parameterId: 'moisture',
      name: 'Moisture %',
      unit: '%',
      weight: 25,
      critical: true,
      criticalThreshold: 12,
      criticalMessage: 'Moisture exceeds 12.0% oil-mill safe crushing and storage specification.',
      allowedEvidenceSources: ['Moisture/meter', 'Lab/Test', 'Physical sample'],
    },
    {
      parameterId: 'foreign_matter',
      name: 'Foreign Matter / Stems / Pods',
      unit: '%',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Lab/Test'],
    },
    {
      parameterId: 'damaged_split',
      name: 'Damaged & Split Seeds',
      unit: '%',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Lab/Test'],
    },
    {
      parameterId: 'discoloured_green',
      name: 'Immature / Greenish Seeds',
      unit: '%',
      weight: 18,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Lab/Test'],
    },
    {
      parameterId: 'oil_protein_appearance',
      name: 'Seed Boldness & Lustre',
      unit: 'Category',
      weight: 17,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
  ],
  questions: [
    {
      id: 'soybean_moisture',
      parameterId: 'moisture',
      section: 'Seed Moisture & Purity',
      questionText: 'Seed Moisture Content Percentage (%)',
      helpText: 'Oil mill benchmark is 10.0% or below (Max 12.0%).',
      inputType: 'NUMBER',
      min: 6,
      max: 20,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Moisture/meter',
    },
    {
      id: 'soybean_foreign_matter',
      parameterId: 'foreign_matter',
      section: 'Seed Moisture & Purity',
      questionText: 'Foreign Matter / Stones / Weed Seeds (%)',
      helpText: 'Standard oil mill deduction applies above 2.0%.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 15,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'soybean_damaged_split',
      parameterId: 'damaged_split',
      section: 'Seed Health & Physical Quality',
      questionText: 'Damaged, Insect-Bored & Split Seeds (%)',
      helpText: 'Broken cotyledons or seed coats from combine threshing.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 30,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'soybean_discoloured',
      parameterId: 'discoloured_green',
      section: 'Seed Health & Physical Quality',
      questionText: 'Immature Greenish / Blackened Seeds (%)',
      helpText: 'Green seeds increase FFA (free fatty acid) in processed oil.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 25,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'soybean_seed_boldness',
      parameterId: 'oil_protein_appearance',
      section: 'Appearance & Variety',
      questionText: 'Seed Boldness & Coat Uniformity',
      helpText: 'Bold bright yellow round seeds denote high oil recovery.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Bold Bright Yellow Round', label: 'Bold Bright Yellow Round (JS-335 / Premium Seed Grade)', score: 100 },
        { value: 'Medium Yellow Standard', label: 'Medium Yellow Standard Commercial', score: 85 },
        { value: 'Small / Shrivelled Seeds', label: 'Small / Shrivelled / Wrinkled Seeds', score: 55 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Premium Oil-Extraction Grade with <10% moisture, high oil content and bright yellow seeds.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Standard Mandi Crushing Grade suitable for industrial solvent extraction.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Commercial / Feed Grade with elevated splits or slight moisture.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'High moisture or heavy contamination requiring cleaning and drying.' },
  ],
};

// ============================================================================
// 5. POTATO QUALITY CONFIGURATION
// ============================================================================
export const POTATO_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Potato',
  aliases: ['potato', 'potatoes', 'aloo', 'kufri jyoti', 'kufri pukhraj', 'kufri chipsona'],
  parameters: [
    {
      parameterId: 'tuber_size',
      name: 'Tuber Size & Weight Grade',
      unit: 'Category',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'greening_solanine',
      name: 'Greening / Solanine Exposure',
      unit: '%',
      weight: 20,
      critical: true,
      criticalThreshold: 5,
      criticalMessage: 'Greening exceeds 5.0% threshold, posing solanine bitterness risk.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'rot_blight',
      name: 'Rot / Late Blight / Soft Decay',
      unit: '%',
      weight: 25,
      critical: true,
      criticalThreshold: 3,
      criticalMessage: 'Tuber rot exceeds 3.0%, causing rapid decay in sack storage.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'cuts_hollow_heart',
      name: 'Mechanical Cuts & Scab Damage',
      unit: '%',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'sprouting_status',
      name: 'Sprouting & Dormancy Status',
      unit: 'Condition',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'soil_adhesion',
      name: 'Soil Adhesion & Dryness',
      unit: 'Condition',
      weight: 10,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
  ],
  questions: [
    {
      id: 'potato_tuber_size',
      parameterId: 'tuber_size',
      section: 'Tuber Sizing & Grading',
      questionText: 'Dominant Tuber Size Category',
      helpText: 'Large (>50mm) for table/chips; Medium (35-50mm) for standard cooking.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Grade A Large (> 55mm)', label: 'Grade A Large (> 55mm / 100g+ per tuber) — Premium Chipsona / Table', score: 100 },
        { value: 'Grade B Medium (35-55mm)', label: 'Grade B Medium (35–55mm) — Standard Wholesale Market', score: 85 },
        { value: 'Small Baby Potato (< 35mm)', label: 'Small / Baby Potato (< 35mm) — Specialty / Seed', score: 70 },
      ],
    },
    {
      id: 'potato_greening',
      parameterId: 'greening_solanine',
      section: 'Quality Defects',
      questionText: 'Green Skin / Sunlight Exposed Tubers Percentage (%)',
      helpText: 'Count tubers with green coloration on skin. Over 5% is rejected by processors.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'potato_rot',
      parameterId: 'rot_blight',
      section: 'Quality Defects',
      questionText: 'Rot, Blight or Soft Decay Percentage (%)',
      helpText: 'Tubers showing wet rot or dry rot lesions.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'potato_cuts',
      parameterId: 'cuts_hollow_heart',
      section: 'Quality Defects',
      questionText: 'Digging Cuts, Scabs or Deep Bruises (%)',
      helpText: 'Harvester blade cuts or common scab blemishes.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 100,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'potato_sprouting',
      parameterId: 'sprouting_status',
      section: 'Storage Condition',
      questionText: 'Eye Sprouting Status',
      helpText: 'Dormant tubers hold shelf life for 3+ months in ventilated cold storage.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Completely Dormant (No sprouts)', label: 'Completely Dormant (No eye sprouting, firm)', score: 100 },
        { value: 'Minor Peeping Eyes (< 2mm)', label: 'Minor Peeping Eyes (< 2mm sprout buds)', score: 75 },
        { value: 'Active Sprouting (> 5mm)', label: 'Active Sprouting (> 5mm sprouts, softening tuber)', score: 30 },
      ],
    },
    {
      id: 'potato_soil',
      parameterId: 'soil_adhesion',
      section: 'Storage Condition',
      questionText: 'Soil Adhesion & Dryness',
      helpText: 'Dry clean tubers prevent fungal incubation in jute bags.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Dry & Clean (< 2% loose sand)', label: 'Dry & Clean (< 2% dry surface sand)', score: 100 },
        { value: 'Moderate Soil Coating', label: 'Moderate Soil Clods', score: 75 },
        { value: 'Wet Muddy Surface', label: 'Wet Muddy Surface (Requires curing)', score: 40 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Export / Supermarket Table Grade with bold size, zero greening, zero rot.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Commercial Mandi Grade suitable for bulk wholesale and standard cooking.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Processing / Small Table Grade with minor skin blemishes or small sizing.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'High greening, active rot or severe harvesting damage.' },
  ],
};

// ============================================================================
// 6. RICE / PADDY QUALITY CONFIGURATION
// ============================================================================
export const RICE_QUALITY_CONFIG: CropQualityConfig = {
  cropName: 'Rice',
  aliases: ['rice', 'paddy', 'basmati rice', 'non-basmati rice', 'chawal', 'dhan'],
  parameters: [
    {
      parameterId: 'moisture',
      name: 'Moisture Content %',
      unit: '%',
      weight: 22,
      critical: true,
      criticalThreshold: 14,
      criticalMessage: 'Moisture exceeds 14.0%, causing milling breakage and yellowing.',
      allowedEvidenceSources: ['Moisture/meter', 'Lab/Test', 'Physical sample'],
    },
    {
      parameterId: 'broken_grains',
      name: 'Broken Grains Percentage',
      unit: '%',
      weight: 20,
      critical: false,
      allowedEvidenceSources: ['Lab/Test', 'Physical sample'],
    },
    {
      parameterId: 'foreign_matter',
      name: 'Foreign Matter / Paddy Husk',
      unit: '%',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Lab/Test'],
    },
    {
      parameterId: 'damaged_chalky',
      name: 'Chalky & Immature Grains',
      unit: '%',
      weight: 18,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Lab/Test'],
    },
    {
      parameterId: 'grain_length_aroma',
      name: 'Grain Length & Aroma Character',
      unit: 'Category',
      weight: 15,
      critical: false,
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
    {
      parameterId: 'odour_condition',
      name: 'Odour & Infestation Cleanliness',
      unit: 'Condition',
      weight: 10,
      critical: true,
      criticalThreshold: 0,
      criticalMessage: 'Mould or weevil odour detected, disqualifying premium grade.',
      allowedEvidenceSources: ['Physical sample', 'Farmer observation'],
    },
  ],
  questions: [
    {
      id: 'rice_moisture',
      parameterId: 'moisture',
      section: 'Moisture & Physical Milling',
      questionText: 'Grain Moisture Content Percentage (%)',
      helpText: 'Optimum milling moisture is 12.5%–13.5%.',
      inputType: 'NUMBER',
      min: 8,
      max: 22,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Moisture/meter',
    },
    {
      id: 'rice_broken_grains',
      parameterId: 'broken_grains',
      section: 'Moisture & Physical Milling',
      questionText: 'Broken Grains Percentage (%)',
      helpText: 'Grains less than 3/4 length. Basmati Premium requires < 5%.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 50,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'rice_foreign_matter',
      parameterId: 'foreign_matter',
      section: 'Grain Purity',
      questionText: 'Foreign Matter / Dust / Chaff (%)',
      helpText: 'Stones, unhulled paddy, and weed seeds.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 15,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'rice_chalky',
      parameterId: 'damaged_chalky',
      section: 'Grain Purity',
      questionText: 'Chalky / Opaque White Grains (%)',
      helpText: 'Grains with more than 50% chalky area.',
      inputType: 'PERCENTAGE',
      min: 0,
      max: 30,
      unit: '%',
      required: true,
      defaultEvidenceSource: 'Physical sample',
    },
    {
      id: 'rice_length_aroma',
      parameterId: 'grain_length_aroma',
      section: 'Aroma & Sizing',
      questionText: 'Grain Length & Distinctive Aroma',
      helpText: 'Extra long slender grains with natural aroma command top export bids.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Extra Long Slender (> 7.5mm) + Aromatic', label: 'Extra Long Slender (> 7.5mm) with Natural Aroma', score: 100 },
        { value: 'Medium Slender (6.0-7.5mm)', label: 'Medium Slender (6.0–7.5mm) Standard Table Rice', score: 85 },
        { value: 'Short Bold Grain (< 6.0mm)', label: 'Short Bold Grain (< 6.0mm) Commercial / Idli Grade', score: 70 },
      ],
    },
    {
      id: 'rice_odour',
      parameterId: 'odour_condition',
      section: 'Aroma & Sizing',
      questionText: 'Odour & Freedom from Infestation',
      helpText: 'Must be completely free from musty smells, live insects or webbing.',
      inputType: 'SELECT',
      required: true,
      defaultEvidenceSource: 'Physical sample',
      options: [
        { value: 'Fresh & Pure (Zero insects)', label: 'Fresh & Pure (Zero live insects / webs)', score: 100 },
        { value: 'Slight Ageing Smell', label: 'Slight Ageing Smell (Aged rice)', score: 80 },
        { value: 'Musty / Infested', label: 'Musty / Weevil Webbed (Unacceptable)', score: 10 },
      ],
    },
  ],
  gradeRules: [
    { grade: 'Grade A', minScore: 90, maxScore: 100, description: 'Super Premium Export Grade with extra long slender grains, <5% broken and low moisture.' },
    { grade: 'Grade B', minScore: 75, maxScore: 89, description: 'Standard Commercial Table Grade with good head rice recovery.' },
    { grade: 'Grade C', minScore: 60, maxScore: 74, description: 'Fair Average Quality (FAQ) suitable for institutional / processing consumption.' },
    { grade: 'REVIEW', minScore: 0, maxScore: 59, description: 'High broken grains, high moisture, or pest infestation.' },
  ],
};

// ============================================================================
// REGISTRY OF ALL SUPPORTED CROPS
// ============================================================================
export const CROP_CONFIGS: Record<string, CropQualityConfig> = {
  onion: ONION_QUALITY_CONFIG,
  'red onion': ONION_QUALITY_CONFIG,
  'garwa onion': ONION_QUALITY_CONFIG,
  'white onion': ONION_QUALITY_CONFIG,
  wheat: WHEAT_QUALITY_CONFIG,
  'sharbati wheat': WHEAT_QUALITY_CONFIG,
  'durum wheat': WHEAT_QUALITY_CONFIG,
  'lokwan wheat': WHEAT_QUALITY_CONFIG,
  tomato: TOMATO_QUALITY_CONFIG,
  'hybrid tomato': TOMATO_QUALITY_CONFIG,
  soybean: SOYBEAN_QUALITY_CONFIG,
  'yellow soybeans': SOYBEAN_QUALITY_CONFIG,
  potato: POTATO_QUALITY_CONFIG,
  rice: RICE_QUALITY_CONFIG,
  paddy: RICE_QUALITY_CONFIG,
  'basmati rice': RICE_QUALITY_CONFIG,
};

export function getQualityConfigForCrop(cropName: string): CropQualityConfig {
  const normalized = (cropName || '').toLowerCase().trim();
  if (CROP_CONFIGS[normalized]) return CROP_CONFIGS[normalized];

  for (const config of Object.values(CROP_CONFIGS)) {
    if (config.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return config;
    }
  }

  // Fallback: Smart generic Produce config
  return {
    ...ONION_QUALITY_CONFIG,
    cropName: cropName || 'General Farm Produce',
    aliases: [normalized],
  };
}
