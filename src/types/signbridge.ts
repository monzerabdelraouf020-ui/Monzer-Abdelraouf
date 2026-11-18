export type SignCategory =
  | 'تحيات'
  | 'تعليم'
  | 'حياة يومية'
  | 'طوارئ'
  | 'ضمائر وأفعال';

export type DatasetSource =
  | 'Egyptian Sign Language Dataset (CC BY 4.0)'
  | 'ArabSign Continuous'
  | 'توسيع ميداني بموافقة المشاركين';

export interface KinematicKeyframe {
  rightHand: { x: number; y: number; openness: number; dx: number; dy: number };
  leftHand: { x: number; y: number; openness: number; dx: number; dy: number; active: boolean };
  headTiltDeg: number;
  browRaise: number;
  shoulderLift: number;
  motionArc: 'linear' | 'circular' | 'tap' | 'wave' | 'point';
}

export interface SignDictionaryItem {
  id: string;
  glossAr: string;
  arabicWord: string;
  englishGloss: string;
  category: SignCategory;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  datasetSource: DatasetSource;
  handShapeAr: string;
  motionTrajectoryAr: string;
  facialCueAr: string;
  bodyAnchor: 'الصدر' | 'الوجه والذقن' | 'الفضاء الأمامي' | 'الجبهة' | 'الكتف';
  exampleSentenceAr: string;
  keyframePose: KinematicKeyframe;
}

export interface SignSequenceScenario {
  id: string;
  titleAr: string;
  glosses: string[];
  literalAr: string;
  fluentArabic: string;
  confidencePct: number;
  latencyMs: number;
  luxEstimate: number;
  lightingMode: 'daylight' | 'indoor' | 'low_light' | 'ambiguous';
  isUncertain: boolean;
  uncertaintyReasonAr?: string;
  signerCode: string;
}

export type ExperimentId =
  | 'exp1_recognition'
  | 'exp2_signer_independent'
  | 'exp3_lighting_background'
  | 'exp4_sequence_vs_isolated';

export type SignerSplit = 'train' | 'unseen_test';

export type LightingCondition =
  | 'daylight'
  | 'indoor_warm'
  | 'low_light_raw'
  | 'low_light_enhanced'
  | 'cluttered_bg';

export type TranslationMode = 'isolated' | 'continuous_sequence';

export interface ExperimentTrialRecord {
  id: string;
  experimentId: ExperimentId;
  signerId: string;
  signerSplit: SignerSplit;
  lightingCondition: LightingCondition;
  mode: TranslationMode;
  expectedSentenceAr: string;
  predictedSentenceAr: string;
  rawGlosses: string[];
  confidencePct: number;
  precisionScore: number;
  recallScore: number;
  werPct: number;
  latencyMs: number;
  rejectedAsUncertain: boolean;
  correctPrediction: boolean;
  timestamp: string;
}

export interface ExperimentBreakdown {
  experimentId: ExperimentId;
  titleAr: string;
  goalAr: string;
  totalTrials: number;
  accuracyPct: number;
  precisionPct: number;
  recallPct: number;
  macroF1Pct: number;
  avgWerPct: number;
  avgLatencyMs: number;
  rejectionRatePct: number;
}

export interface ResearchSummary {
  totalTrials: number;
  accuracyPct: number;
  precisionPct: number;
  recallPct: number;
  macroF1Pct: number;
  avgWerPct: number;
  avgLatencyMs: number;
  rejectionRatePct: number;
  seenSignerAccuracyPct: number;
  unseenSignerAccuracyPct: number;
  staticBaselineUnseenPct: number;
  lowLightRawAccuracyPct: number;
  lowLightEnhancedAccuracyPct: number;
  isolatedWerPct: number;
  sequenceWerPct: number;
  experiments: ExperimentBreakdown[];
}

export interface TranslationHistoryItem {
  id: string;
  glosses: string[];
  rawLiteralAr: string;
  contextualSentenceAr: string;
  confidencePct: number;
  rejectedAsUncertain: boolean;
  lightingLuxEstimate: number;
  latencyMs: number;
  signerMode: 'live_camera' | 'simulator' | 'reverse_speech';
  consentConfirmed: boolean;
  createdAt: string;
}
