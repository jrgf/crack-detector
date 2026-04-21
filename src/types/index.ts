export type CrackClass = 'flexural' | 'settlement' | 'shear' | 'corrosion';

export type StructureType = 'building' | 'bridge' | 'wall' | 'slab' | 'other';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ClassificationResult {
  class: CrackClass;
  correctedClass?: CrackClass;
  correctedAt?: number;
  confidence: number;
  allProbabilities: Record<CrackClass, number>;
  imageUri: string;
  structureType: StructureType;
  timestamp: number;
}

export interface SavedClassification extends ClassificationResult {
  id: string;
}

export interface ClassTemplate {
  label: string;
  short_description: string;
  common_causes: string[];
  visual_indicators: string[];
  severity_thresholds: {
    minor: string;
    moderate: string;
    severe: string;
  };
  recommended_actions: string[];
  urgency_level: UrgencyLevel;
  aci_reference: string;
  common_elements: string[];
}

export interface TemplatesData {
  version: string;
  source: string;
  language: string;
  classes: Record<CrackClass, ClassTemplate>;
  urgency_levels: Record<UrgencyLevel, {
    color: string;
    label: string;
    action: string;
  }>;
  disclaimer: string;
}
