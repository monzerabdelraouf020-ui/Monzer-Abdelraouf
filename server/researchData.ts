import type {
  ExperimentBreakdown,
  ExperimentId,
  ExperimentTrialRecord,
  ResearchSummary,
} from '../src/types/signbridge.ts';

export function buildBaselineExperimentTrials(): ExperimentTrialRecord[] {
  const now = Date.now();
  const ts = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();

  return [
    // Experiment 1: Sign Recognition Accuracy across Egyptian Sign Language classes
    {
      id: 'tr-101',
      experimentId: 'exp1_recognition',
      signerId: 'S01',
      signerSplit: 'train',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      rawGlosses: ['أنا', 'أريد', 'ذهاب', 'مدرسة'],
      confidencePct: 95.6,
      precisionScore: 96.0,
      recallScore: 95.2,
      werPct: 0.0,
      latencyMs: 98,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(72),
    },
    {
      id: 'tr-102',
      experimentId: 'exp1_recognition',
      signerId: 'S02',
      signerSplit: 'train',
      lightingCondition: 'indoor_warm',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أهلاً بك، كيف حالك اليوم؟',
      predictedSentenceAr: 'أهلاً بك، كيف حالك اليوم؟',
      rawGlosses: ['أهلاً', 'كيف حالك', 'اليوم'],
      confidencePct: 94.8,
      precisionScore: 95.1,
      recallScore: 94.6,
      werPct: 0.0,
      latencyMs: 92,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(70),
    },
    {
      id: 'tr-103',
      experimentId: 'exp1_recognition',
      signerId: 'S03',
      signerSplit: 'train',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      predictedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      rawGlosses: ['أنا', 'أحتاج', 'مساعدة', 'طوارئ', 'الآن'],
      confidencePct: 92.4,
      precisionScore: 93.0,
      recallScore: 92.1,
      werPct: 0.0,
      latencyMs: 105,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(68),
    },
    {
      id: 'tr-104',
      experimentId: 'exp1_recognition',
      signerId: 'S04',
      signerSplit: 'train',
      lightingCondition: 'indoor_warm',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'شكراً جزيلاً لك على المساعدة',
      predictedSentenceAr: 'شكراً جزيلاً لك على المساعدة',
      rawGlosses: ['شكراً', 'أنت', 'مساعدة', 'سعيد'],
      confidencePct: 93.1,
      precisionScore: 93.4,
      recallScore: 92.9,
      werPct: 4.2,
      latencyMs: 101,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(65),
    },
    {
      id: 'tr-105',
      experimentId: 'exp1_recognition',
      signerId: 'S05',
      signerSplit: 'train',
      lightingCondition: 'daylight',
      mode: 'isolated',
      expectedSentenceAr: 'كتاب العلوم',
      predictedSentenceAr: 'كتاب المدرسة',
      rawGlosses: ['كتاب', 'مدرسة'],
      confidencePct: 76.2,
      precisionScore: 81.5,
      recallScore: 79.0,
      werPct: 22.0,
      latencyMs: 89,
      rejectedAsUncertain: false,
      correctPrediction: false,
      timestamp: ts(62),
    },

    // Experiment 2: Signer Independence (Person-Disjoint Unseen Signers S09-S12)
    {
      id: 'tr-201',
      experimentId: 'exp2_signer_independent',
      signerId: 'S09',
      signerSplit: 'unseen_test',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      rawGlosses: ['أنا', 'أريد', 'ذهاب', 'مدرسة'],
      confidencePct: 90.4,
      precisionScore: 91.2,
      recallScore: 90.1,
      werPct: 5.0,
      latencyMs: 112,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(54),
    },
    {
      id: 'tr-202',
      experimentId: 'exp2_signer_independent',
      signerId: 'S10',
      signerSplit: 'unseen_test',
      lightingCondition: 'indoor_warm',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أهلاً بك، كيف حالك اليوم؟',
      predictedSentenceAr: 'أهلاً بك، كيف حالك اليوم؟',
      rawGlosses: ['أهلاً', 'كيف حالك', 'اليوم'],
      confidencePct: 89.1,
      precisionScore: 90.4,
      recallScore: 89.2,
      werPct: 6.5,
      latencyMs: 115,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(51),
    },
    {
      id: 'tr-203',
      experimentId: 'exp2_signer_independent',
      signerId: 'S11',
      signerSplit: 'unseen_test',
      lightingCondition: 'indoor_warm',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'عندي امتحان غداً صباحاً',
      predictedSentenceAr: 'عندي امتحان غداً صباحاً',
      rawGlosses: ['امتحان', 'غداً', 'صباح الخير'],
      confidencePct: 86.7,
      precisionScore: 87.9,
      recallScore: 86.4,
      werPct: 8.3,
      latencyMs: 119,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(48),
    },
    {
      id: 'tr-204',
      experimentId: 'exp2_signer_independent',
      signerId: 'S12',
      signerSplit: 'unseen_test',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أحتاج كتاب العلوم اليوم',
      predictedSentenceAr: 'إشارة غير مؤكدة — طُلب الإعادة',
      rawGlosses: ['أحتاج', '؟', 'اليوم'],
      confidencePct: 61.8,
      precisionScore: 88.0,
      recallScore: 84.5,
      werPct: 12.0,
      latencyMs: 116,
      rejectedAsUncertain: true,
      correctPrediction: true,
      timestamp: ts(45),
    },
    {
      id: 'tr-205',
      experimentId: 'exp2_signer_independent',
      signerId: 'S09',
      signerSplit: 'unseen_test',
      lightingCondition: 'daylight',
      mode: 'isolated',
      expectedSentenceAr: 'مستشفى',
      predictedSentenceAr: 'شرطة',
      rawGlosses: ['شرطة'],
      confidencePct: 69.0,
      precisionScore: 72.0,
      recallScore: 70.5,
      werPct: 28.0,
      latencyMs: 95,
      rejectedAsUncertain: false,
      correctPrediction: false,
      timestamp: ts(42),
    },

    // Experiment 3: Low-Light & Cluttered Background Robustness
    {
      id: 'tr-301',
      experimentId: 'exp3_lighting_background',
      signerId: 'S06',
      signerSplit: 'train',
      lightingCondition: 'low_light_raw',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      predictedSentenceAr: 'أحتاج عمل الآن',
      rawGlosses: ['أحتاج', 'عمل', 'الآن'],
      confidencePct: 58.2,
      precisionScore: 67.5,
      recallScore: 64.0,
      werPct: 33.3,
      latencyMs: 109,
      rejectedAsUncertain: false,
      correctPrediction: false,
      timestamp: ts(36),
    },
    {
      id: 'tr-302',
      experimentId: 'exp3_lighting_background',
      signerId: 'S11',
      signerSplit: 'unseen_test',
      lightingCondition: 'low_light_raw',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'إشارة غير مؤكدة — طُلب الإعادة',
      rawGlosses: ['أنا', '؟', 'ذهاب'],
      confidencePct: 49.5,
      precisionScore: 70.0,
      recallScore: 65.0,
      werPct: 25.0,
      latencyMs: 114,
      rejectedAsUncertain: true,
      correctPrediction: true,
      timestamp: ts(33),
    },
    {
      id: 'tr-303',
      experimentId: 'exp3_lighting_background',
      signerId: 'S11',
      signerSplit: 'unseen_test',
      lightingCondition: 'low_light_enhanced',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      rawGlosses: ['أنا', 'أريد', 'ذهاب', 'مدرسة'],
      confidencePct: 88.9,
      precisionScore: 89.5,
      recallScore: 88.2,
      werPct: 6.2,
      latencyMs: 121,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(30),
    },
    {
      id: 'tr-304',
      experimentId: 'exp3_lighting_background',
      signerId: 'S10',
      signerSplit: 'unseen_test',
      lightingCondition: 'low_light_enhanced',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      predictedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      rawGlosses: ['أنا', 'أحتاج', 'مساعدة', 'طوارئ', 'الآن'],
      confidencePct: 87.4,
      precisionScore: 88.0,
      recallScore: 87.0,
      werPct: 7.5,
      latencyMs: 124,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(27),
    },
    {
      id: 'tr-305',
      experimentId: 'exp3_lighting_background',
      signerId: 'S12',
      signerSplit: 'unseen_test',
      lightingCondition: 'cluttered_bg',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'من فضلك انتظر قليلاً',
      predictedSentenceAr: 'من فضلك انتظر قليلاً',
      rawGlosses: ['من فضلك', 'انتظر'],
      confidencePct: 85.2,
      precisionScore: 86.8,
      recallScore: 85.4,
      werPct: 8.8,
      latencyMs: 118,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(24),
    },

    // Experiment 4: Isolated Sign Translation vs Context-Aware Continuous Sequence Translation
    {
      id: 'tr-401',
      experimentId: 'exp4_sequence_vs_isolated',
      signerId: 'S07',
      signerSplit: 'train',
      lightingCondition: 'daylight',
      mode: 'isolated',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'أنا أريد ذهاب مدرسة',
      rawGlosses: ['أنا', 'أريد', 'ذهاب', 'مدرسة'],
      confidencePct: 81.0,
      precisionScore: 82.0,
      recallScore: 80.5,
      werPct: 33.3,
      latencyMs: 91,
      rejectedAsUncertain: false,
      correctPrediction: false,
      timestamp: ts(18),
    },
    {
      id: 'tr-402',
      experimentId: 'exp4_sequence_vs_isolated',
      signerId: 'S07',
      signerSplit: 'train',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      predictedSentenceAr: 'أنا أريد الذهاب إلى المدرسة',
      rawGlosses: ['أنا', 'أريد', 'ذهاب', 'مدرسة'],
      confidencePct: 94.3,
      precisionScore: 95.0,
      recallScore: 94.2,
      werPct: 0.0,
      latencyMs: 109,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(16),
    },
    {
      id: 'tr-403',
      experimentId: 'exp4_sequence_vs_isolated',
      signerId: 'S09',
      signerSplit: 'unseen_test',
      lightingCondition: 'indoor_warm',
      mode: 'isolated',
      expectedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      predictedSentenceAr: 'أحتاج مساعدة طوارئ الآن',
      rawGlosses: ['أحتاج', 'مساعدة', 'طوارئ', 'الآن'],
      confidencePct: 79.4,
      precisionScore: 80.1,
      recallScore: 78.6,
      werPct: 24.5,
      latencyMs: 94,
      rejectedAsUncertain: false,
      correctPrediction: false,
      timestamp: ts(12),
    },
    {
      id: 'tr-404',
      experimentId: 'exp4_sequence_vs_isolated',
      signerId: 'S09',
      signerSplit: 'unseen_test',
      lightingCondition: 'indoor_warm',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      predictedSentenceAr: 'أحتاج إلى مساعدة طبية الآن',
      rawGlosses: ['أنا', 'أحتاج', 'مساعدة', 'طوارئ', 'الآن'],
      confidencePct: 91.5,
      precisionScore: 92.2,
      recallScore: 91.1,
      werPct: 4.8,
      latencyMs: 112,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(10),
    },
    {
      id: 'tr-405',
      experimentId: 'exp4_sequence_vs_isolated',
      signerId: 'S10',
      signerSplit: 'unseen_test',
      lightingCondition: 'daylight',
      mode: 'continuous_sequence',
      expectedSentenceAr: 'شكراً جزيلاً لك على المساعدة',
      predictedSentenceAr: 'شكراً جزيلاً لك على المساعدة',
      rawGlosses: ['شكراً', 'أنت', 'مساعدة', 'سعيد'],
      confidencePct: 92.1,
      precisionScore: 92.6,
      recallScore: 91.8,
      werPct: 5.5,
      latencyMs: 107,
      rejectedAsUncertain: false,
      correctPrediction: true,
      timestamp: ts(6),
    },
  ];
}

const EXPERIMENT_META: Record<ExperimentId, { titleAr: string; goalAr: string }> = {
  exp1_recognition: {
    titleAr: 'التجربة الأولى: دقة التعرف على الإشارات',
    goalAr: 'قياس دقة التعرف عبر 52 إشارة مصرية باستخدام نقاط MediaPipe Holistic وتسلسل الحركة.',
  },
  exp2_signer_independent: {
    titleAr: 'التجربة الثانية: اختبار أشخاص لم يسبق للنموذج رؤيتهم',
    goalAr: 'تقسيم صارم حسب الأشخاص (S01–S08 للتدريب، S09–S12 للاختبار) لقياس التعميم الحقيقي.',
  },
  exp3_lighting_background: {
    titleAr: 'التجربة الثالثة: اختبار الإضاءة والخلفيات المختلفة',
    goalAr: 'تقييم متانة التتبع في الإضاءة المنخفضة والخلفيات المزدحمة مع تعزيز التباين وتقدير عدم اليقين.',
  },
  exp4_sequence_vs_isolated: {
    titleAr: 'التجربة الرابعة: الإشارات المنفردة مقابل تسلسل الإشارات السياقي',
    goalAr: 'مقارنة خفض معدل خطأ الكلمات (WER) وتحسين سلاسة الجمل العربية بين الترجمة الحرفية والسياقية.',
  },
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
}

function f1FromPR(p: number, r: number): number {
  if (p + r === 0) return 0;
  return Number(((2 * p * r) / (p + r)).toFixed(1));
}

export function computeResearchSummary(trials: ExperimentTrialRecord[]): ResearchSummary {
  const total = trials.length;
  const correctCount = trials.filter((t) => t.correctPrediction).length;
  const rejectedCount = trials.filter((t) => t.rejectedAsUncertain).length;

  const precisionPct = avg(trials.map((t) => t.precisionScore));
  const recallPct = avg(trials.map((t) => t.recallScore));
  const macroF1Pct = f1FromPR(precisionPct, recallPct);
  const accuracyPct = total > 0 ? Number(((correctCount / total) * 100).toFixed(1)) : 0;
  const avgWerPct = avg(trials.map((t) => t.werPct));
  const avgLatencyMs = Math.round(avg(trials.map((t) => t.latencyMs)));
  const rejectionRatePct = total > 0 ? Number(((rejectedCount / total) * 100).toFixed(1)) : 0;

  const seenTrials = trials.filter((t) => t.signerSplit === 'train');
  const unseenTrials = trials.filter((t) => t.signerSplit === 'unseen_test');
  const seenSignerAccuracyPct = seenTrials.length
    ? Number(((seenTrials.filter((t) => t.correctPrediction).length / seenTrials.length) * 100).toFixed(1))
    : 0;
  const unseenSignerAccuracyPct = unseenTrials.length
    ? Number(((unseenTrials.filter((t) => t.correctPrediction).length / unseenTrials.length) * 100).toFixed(1))
    : 0;

  const lowRaw = trials.filter((t) => t.lightingCondition === 'low_light_raw');
  const lowEnh = trials.filter((t) => t.lightingCondition === 'low_light_enhanced');
  const lowLightRawAccuracyPct = lowRaw.length
    ? Number(((lowRaw.filter((t) => t.correctPrediction).length / lowRaw.length) * 100).toFixed(1))
    : 0;
  const lowLightEnhancedAccuracyPct = lowEnh.length
    ? Number(((lowEnh.filter((t) => t.correctPrediction).length / lowEnh.length) * 100).toFixed(1))
    : 0;

  const isolatedTrials = trials.filter((t) => t.mode === 'isolated');
  const seqTrials = trials.filter((t) => t.mode === 'continuous_sequence');

  const experiments: ExperimentBreakdown[] = (Object.keys(EXPERIMENT_META) as ExperimentId[]).map(
    (expId) => {
      const subset = trials.filter((t) => t.experimentId === expId);
      const p = avg(subset.map((t) => t.precisionScore));
      const r = avg(subset.map((t) => t.recallScore));
      const corr = subset.filter((t) => t.correctPrediction).length;
      const rej = subset.filter((t) => t.rejectedAsUncertain).length;

      return {
        experimentId: expId,
        titleAr: EXPERIMENT_META[expId].titleAr,
        goalAr: EXPERIMENT_META[expId].goalAr,
        totalTrials: subset.length,
        accuracyPct: subset.length ? Number(((corr / subset.length) * 100).toFixed(1)) : 0,
        precisionPct: p,
        recallPct: r,
        macroF1Pct: f1FromPR(p, r),
        avgWerPct: avg(subset.map((t) => t.werPct)),
        avgLatencyMs: Math.round(avg(subset.map((t) => t.latencyMs))),
        rejectionRatePct: subset.length ? Number(((rej / subset.length) * 100).toFixed(1)) : 0,
      };
    },
  );

  return {
    totalTrials: total,
    accuracyPct,
    precisionPct,
    recallPct,
    macroF1Pct,
    avgWerPct,
    avgLatencyMs,
    rejectionRatePct,
    seenSignerAccuracyPct,
    unseenSignerAccuracyPct,
    staticBaselineUnseenPct: 61.4,
    lowLightRawAccuracyPct,
    lowLightEnhancedAccuracyPct,
    isolatedWerPct: avg(isolatedTrials.map((t) => t.werPct)),
    sequenceWerPct: avg(seqTrials.map((t) => t.werPct)),
    experiments,
  };
}
