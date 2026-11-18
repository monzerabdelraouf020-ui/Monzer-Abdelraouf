import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  ExperimentId,
  ExperimentTrialRecord,
  ResearchSummary,
} from '../types/signbridge';

interface ResearchDashboardViewProps {
  summary: ResearchSummary;
  trials: ExperimentTrialRecord[];
  onResetTrials: () => Promise<void>;
  onStartTranslator: () => void;
}

const INNOVATIONS = [
  {
    index: '01',
    title: 'الاستقلال عن الشخص (Signer Independence)',
    desc: 'تقسيم صارم لبيانات التدريب والاختبار حسب الأشخاص (S01–S08 مقابل S09–S12) لضمان تعميم النموذج على أشخاص جدد.',
  },
  {
    index: '02',
    title: 'فهم الحركة المتتابعة (Motion Understanding)',
    desc: 'تحليل التسلسل الزمني لمفاصل اليدين والكتفين والوجه عبر MediaPipe Holistic بدل الاعتماد على صورة ثابتة.',
  },
  {
    index: '03',
    title: 'الترجمة السياقية (Context-Aware Translation)',
    desc: 'دمج الإشارات المتتالية في جملة عربية سليمة نحويًا بدل الترجمة الحرفية المنفصلة لكل حركة.',
  },
  {
    index: '04',
    title: 'كشف عدم اليقين (Uncertainty Detection)',
    desc: 'رفض التنبؤ وطلب إعادة الإشارة عندما تنخفض الثقة عن 72% بدل اختراع ترجمة خاطئة.',
  },
  {
    index: '05',
    title: 'مقاومة الإضاءة المنخفضة (Low-Light Robustness)',
    desc: 'تعزيز التباين التكيفي وقياس شدة الإضاءة (Lux) لتحسين دقة التتبع في البيئات الضعيفة الإضاءة.',
  },
];

export const ResearchDashboardView: React.FC<ResearchDashboardViewProps> = ({
  summary,
  trials,
  onResetTrials,
  onStartTranslator,
}) => {
  const [selectedExp, setSelectedExp] = useState<'all' | ExperimentId>('all');
  const [splitFilter, setSplitFilter] = useState<'all' | 'train' | 'unseen_test'>('all');
  const [resetting, setResetting] = useState(false);

  const filteredTrials = useMemo(() => {
    return trials.filter((t) => {
      if (selectedExp !== 'all' && t.experimentId !== selectedExp) return false;
      if (splitFilter !== 'all' && t.signerSplit !== splitFilter) return false;
      return true;
    });
  }, [trials, selectedExp, splitFilter]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetTrials();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Research Question & Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="text-xs font-medium text-cyan-300">
              بحث علمي ISEF · Context-Aware Egyptian Sign Language Translation
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 leading-snug text-balance">
              ترجمة لغة الإشارة المصرية عبر تسلسل الحركة وتقدير عدم اليقين
            </h1>
            <div className="rounded-xl bg-[#111a2e] border border-slate-800 p-4 space-y-1.5">
              <div className="text-xs font-semibold text-fuchsia-300">السؤال البحثي:</div>
              <p className="text-sm text-slate-200 leading-relaxed">
                هل يؤدي دمج المعلومات الحركية لليدين والجسم وتقدير عدم اليقين إلى تحسين دقة ترجمة لغة الإشارة المصرية إلى جمل عربية في الوقت الفعلي، خصوصًا عند اختبار أشخاص لم يشاركوا في تدريب النموذج؟
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartTranslator}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors cursor-pointer neon-glow-cyan"
            >
              تجربة المترجم المباشر الآن
            </button>
            <span className="text-xs text-slate-400">
              قاعدة بيانات SQLite حية · {summary.totalTrials} تجربة مسجلة
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-cyan-500/25 overflow-hidden bg-[#0d1322] relative min-h-[240px]">
          <img
            src="/src/assets/images/signbridge_hero_studio_1794929031151.jpg"
            alt="عرض توضيحي لترجمة لغة الإشارة المصرية في بيئة بحثية"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:absolute lg:inset-0"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07090f]/95 via-[#07090f]/60 to-transparent p-4 text-white">
            <div className="text-xs font-semibold text-cyan-300">نظام SignBridge AI</div>
            <div className="text-[11px] text-slate-200">
              من لغة الإشارة إلى النص والصوت العربي بدون قفازات أو كاميرات متخصصة
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Metrics KPI Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#0d1322] border border-cyan-500/25 rounded-xl p-4">
          <div className="text-xs text-slate-400">دقة التعرف (Accuracy)</div>
          <div className="text-2xl font-bold text-cyan-300 font-mono-tabular mt-1">
            {summary.accuracyPct}%
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            أشخاص جدد: <span className="font-mono-tabular text-cyan-200">{summary.unseenSignerAccuracyPct}%</span>
          </div>
        </div>

        <div className="bg-[#0d1322] border border-fuchsia-500/25 rounded-xl p-4">
          <div className="text-xs text-slate-400">معدل Macro-F1</div>
          <div className="text-2xl font-bold text-fuchsia-300 font-mono-tabular mt-1">
            {summary.macroF1Pct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono-tabular">
            P {summary.precisionPct}% · R {summary.recallPct}%
          </div>
        </div>

        <div className="bg-[#0d1322] border border-cyan-500/25 rounded-xl p-4">
          <div className="text-xs text-slate-400">معدل أخطاء الكلمات (WER)</div>
          <div className="text-2xl font-bold text-slate-50 font-mono-tabular mt-1">
            {summary.avgWerPct}%
          </div>
          <div className="text-[11px] text-cyan-300 mt-1 font-mono-tabular">
            السياقي {summary.sequenceWerPct}% مقابل المنفرد {summary.isolatedWerPct}%
          </div>
        </div>

        <div className="bg-[#0d1322] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">زمن الترجمة (Latency)</div>
          <div className="text-2xl font-bold text-slate-50 font-mono-tabular mt-1">
            {summary.avgLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">معالجة حية عبر الزمن</div>
        </div>

        <div className="bg-[#0d1322] border border-amber-400/35 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400">معدل رفض عدم اليقين</div>
          <div className="text-2xl font-bold text-amber-300 font-mono-tabular mt-1">
            {summary.rejectionRatePct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">يمنع اختراع ترجمات خاطئة</div>
        </div>
      </section>

      {/* 5 Core Innovations + Holistic Figure */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-50">
            محاور الابتكار العلمي المختبرة في التجارب
          </h2>
          <div className="divide-y divide-slate-800">
            {INNOVATIONS.map((inv) => (
              <div key={inv.index} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <span className="font-mono-tabular text-xs font-bold text-cyan-400 mt-0.5 shrink-0">
                  {inv.index}.
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{inv.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{inv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-white">
            <img
              src="/src/assets/images/mediapipe_holistic_diagram_1794929030130.jpg"
              alt="مخطط استخراج نقاط اليدين والجسم والوجه عبر MediaPipe Holistic"
              referrerPolicy="no-referrer"
              className="w-full h-56 object-contain bg-white"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-cyan-300">
              لماذا MediaPipe Holistic؟
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تدمج المنصة نقاط اليدين اليمنى واليسرى مع تعبيرات الوجه ومفاصل الكتفين لتحليل تسلسل الحركة الزمني بدون الحاجة لقفازات استشعار.
            </p>
          </div>
        </div>
      </section>

      {/* Four Scientific Experiments Breakdown + Comparative Bars */}
      <section className="bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-50">
              نتائج التجارب العلمية الأربع (ISEF Experiments)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مقارنة الأداء الفعلي المحسوب من قاعدة بيانات التجارب مع التقسيم حسب الأشخاص.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/30 bg-[#111a2e] text-xs font-medium text-cyan-300 hover:border-cyan-400 cursor-pointer self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetting ? 'جاري الاستعادة...' : 'استعادة التجارب المرجعية'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.experiments.map((exp) => (
            <div
              key={exp.experimentId}
              className="rounded-xl border border-slate-800 bg-[#111a2e] p-4 space-y-3"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-100">{exp.titleAr}</h3>
                <p className="text-xs text-slate-400 mt-1">{exp.goalAr}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
                <div>
                  <div className="text-[11px] text-slate-400">Accuracy</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono-tabular">
                    {exp.accuracyPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Macro-F1</div>
                  <div className="text-sm font-bold text-fuchsia-300 font-mono-tabular">
                    {exp.macroF1Pct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">WER</div>
                  <div className="text-sm font-bold text-slate-100 font-mono-tabular">
                    {exp.avgWerPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Rejection</div>
                  <div className="text-sm font-bold text-amber-300 font-mono-tabular">
                    {exp.rejectionRatePct}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparative Bar Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="rounded-xl border border-slate-800 bg-[#111a2e] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">
              مقارنة التعميم على أشخاص جدد (Signer Independence)
            </h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  label: 'نموذج اليد الثابتة فقط (أشخاص جدد)',
                  val: summary.staticBaselineUnseenPct,
                  color: 'bg-slate-500',
                },
                {
                  label: 'SignBridge AI على مجموعة التدريب (S01–S08)',
                  val: summary.seenSignerAccuracyPct,
                  color: 'bg-fuchsia-400',
                },
                {
                  label: 'SignBridge AI على أشخاص جدد (S09–S12)',
                  val: summary.unseenSignerAccuracyPct,
                  color: 'bg-cyan-400',
                },
              ].map((bar) => (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{bar.label}</span>
                    <span className="font-mono-tabular font-semibold text-slate-100">
                      {bar.val}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${Math.min(100, bar.val)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111a2e] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">
              أثر تعزيز الإضاءة المنخفضة والترجمة السياقية
            </h3>
            <div className="space-y-3 text-xs">
              {[
                {
                  label: 'دقة الإضاءة المنخفضة (خام بدون تحسين)',
                  val: summary.lowLightRawAccuracyPct,
                  color: 'bg-amber-400',
                },
                {
                  label: 'دقة الإضاءة المنخفضة (بعد تعزيز التباين)',
                  val: summary.lowLightEnhancedAccuracyPct,
                  color: 'bg-cyan-400',
                },
                {
                  label: 'معدل الخطأ WER — الإشارات المنفردة',
                  val: summary.isolatedWerPct,
                  color: 'bg-rose-400',
                },
                {
                  label: 'معدل الخطأ WER — التسلسل السياقي (الأقل أفضل)',
                  val: summary.sequenceWerPct,
                  color: 'bg-fuchsia-400',
                },
              ].map((bar) => (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{bar.label}</span>
                    <span className="font-mono-tabular font-semibold text-slate-100">
                      {bar.val}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${Math.min(100, bar.val)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dataset Provenance & Field Context */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-2xl border border-cyan-500/25 overflow-hidden bg-[#0d1322] relative min-h-[220px]">
          <img
            src="/src/assets/images/egyptian_classroom_assistive_1794929031889.jpg"
            alt="تطبيق ميداني للتواصل بين الطلاب الصم والسامعين"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:absolute lg:inset-0"
          />
        </div>

        <div className="lg:col-span-7 bg-[#0d1322] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-50">
            مصادر بيانات التدريب وضوابط التجارب العلمية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-cyan-500/25 bg-[#111a2e] p-4 space-y-1.5">
              <div className="text-xs font-semibold text-cyan-300">المصدر الأول · CC BY 4.0</div>
              <h3 className="text-sm font-bold text-slate-100">Egyptian Sign Language Dataset</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                قاعدة بيانات منشورة على Mendeley Data (إصدار 2026) تحتوي على أكثر من 50 كلمة مصرية مصنفة بمئات الفيديوهات.
              </p>
            </div>
            <div className="rounded-xl border border-fuchsia-500/25 bg-[#111a2e] p-4 space-y-1.5">
              <div className="text-xs font-semibold text-fuchsia-300">المصدر الثاني · تسلسل الجمل</div>
              <h3 className="text-sm font-bold text-slate-100">ArabSign Continuous Dataset</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                9,335 عينة و50 جملة مع بيانات الحركة؛ تُستخدم لدراسة تسلسل الإشارات مع فصل تام عن اللهجة المصرية.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-300">قاعدة التقسيم المنهجي:</strong> يتم تقسيم بيانات التدريب والاختبار حسب الأشخاص المشاركين وليس عشوائيًا حسب الفيديوهات، مع تسجيل عينات جديدة بموافقة المشاركين الصريحة.
          </p>
        </div>
      </section>

      {/* Experiment Trials Log Table */}
      <section className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-50">
            سجل عينات التجارب المخزنة في SQLite ({filteredTrials.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedExp}
              onChange={(e) => setSelectedExp(e.target.value as 'all' | ExperimentId)}
              aria-label="تصفية حسب التجربة"
              className="rounded-lg border border-slate-700 bg-[#111a2e] px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="all">جميع التجارب الأربع</option>
              <option value="exp1_recognition">التجربة 1: دقة التعرف</option>
              <option value="exp2_signer_independent">التجربة 2: أشخاص جدد</option>
              <option value="exp3_lighting_background">التجربة 3: الإضاءة والخلفيات</option>
              <option value="exp4_sequence_vs_isolated">التجربة 4: التسلسل السياقي</option>
            </select>

            <select
              value={splitFilter}
              onChange={(e) => setSplitFilter(e.target.value as 'all' | 'train' | 'unseen_test')}
              aria-label="تصفية حسب تقسيم الأشخاص"
              className="rounded-lg border border-slate-700 bg-[#111a2e] px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="all">كل المشاركين</option>
              <option value="train">مجموعة التدريب (S01–S08)</option>
              <option value="unseen_test">أشخاص جدد (S09–S12 / Live)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-medium">المشارك</th>
                <th className="py-2.5 px-3 font-medium">الإضاءة / الوضع</th>
                <th className="py-2.5 px-3 font-medium">الجملة المتوقعة</th>
                <th className="py-2.5 px-3 font-medium">مخرجات النظام</th>
                <th className="py-2.5 px-3 font-medium">الثقة</th>
                <th className="py-2.5 px-3 font-medium">WER</th>
                <th className="py-2.5 px-3 font-medium">الزمن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTrials.map((trial) => (
                <tr key={trial.id} className="hover:bg-[#111a2e]/70">
                  <td className="py-2.5 px-3 font-mono-tabular font-semibold text-cyan-300">
                    {trial.signerId}
                    <div className="text-[11px] font-sans font-normal text-slate-400">
                      {trial.signerSplit === 'unseen_test' ? 'جديد' : 'تدريب'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {trial.lightingCondition}
                    <div className="text-[11px] text-slate-500">
                      {trial.mode === 'continuous_sequence' ? 'تسلسل سياقي' : 'إشارة منفردة'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{trial.expectedSentenceAr}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={
                        trial.rejectedAsUncertain
                          ? 'text-amber-300 font-medium'
                          : trial.correctPrediction
                          ? 'text-cyan-300 font-medium'
                          : 'text-rose-300 font-medium'
                      }
                    >
                      {trial.predictedSentenceAr}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-200">
                    {trial.confidencePct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-200">
                    {trial.werPct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-400">
                    {trial.latencyMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
