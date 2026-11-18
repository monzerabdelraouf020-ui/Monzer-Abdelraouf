import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
  History,
  Search,
  Smartphone,
  Volume2,
} from 'lucide-react';

export type GuideTargetScreen =
  | 'translator'
  | 'dictionary'
  | 'learning'
  | 'history'
  | 'research';

interface GuideItem {
  label: string;
  detail: string;
}

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  targetScreen?: GuideTargetScreen;
  targetLabel?: string;
  icon: typeof HelpCircle;
  accent: 'cyan' | 'fuchsia';
  items: GuideItem[];
}

interface GuideViewProps {
  readSectionIds: string[];
  onMarkSectionRead: (sectionId: string) => void;
  onNavigate: (screen: GuideTargetScreen) => void;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'overview',
    title: '1. كيف يعمل SignBridge AI من البداية للنهاية؟',
    subtitle: 'فهم فكرة المشروع ومسار تحويل لغة الإشارة المصرية إلى نص وصوت عربي',
    targetScreen: 'translator',
    targetLabel: 'جرّب المترجم الآن',
    icon: HelpCircle,
    accent: 'cyan',
    items: [
      {
        label: 'التقاط الحركة بالكاميرا العادية',
        detail:
          'لا يحتاج الموقع إلى قفازات ذكية أو كاميرات خاصة؛ تكفي كاميرا الهاتف أو اللابتوب العادية لالتقاط حركة اليدين والكتفين والوجه.',
      },
      {
        label: 'استخراج النقاط عبر MediaPipe Holistic',
        detail:
          'يحلل النظام 21 نقطة لكل يد مع نقاط الكتفين والذراعين وتعبيرات الوجه في الوقت الفعلي داخل المتصفح، لأن لغة الإشارة تعتمد على حركة اليدين وتعبيرات الوجه معاً.',
      },
      {
        label: 'تحليل التسلسل الزمني للحركة',
        detail:
          'بدلاً من النظر إلى صورة واحدة ثابتة، يتتبع النظام سرعة الحركة واتجاهها عبر الزمن ليميز الإشارات المتحركة مثل «أريد» و«الذهاب».',
      },
      {
        label: 'الترجمة السياقية والنطق العربي',
        detail:
          'يحوّل الإشارات المتتابعة مثل (أنا + أريد + ذهاب + مدرسة) إلى جملة عربية مفهومة: «أنا أريد الذهاب إلى المدرسة» ثم ينطقها بصوت مسموع.',
      },
    ],
  },
  {
    id: 'translator',
    title: '2. شرح كل تفصيلة في شاشة «المترجم المباشر»',
    subtitle: 'جميع الأزرار والوضعين المباشر والعكسي والإعدادات المتقدمة',
    targetScreen: 'translator',
    targetLabel: 'افتح المترجم المباشر',
    icon: Camera,
    accent: 'cyan',
    items: [
      {
        label: 'التبديل بين «إشارة ← نص وصوت» و«كلام ← إشارة مرئية»',
        detail:
          'الوضع الأول يترجم حركات الشخص الأصم إلى كلام عربي مكتوب ومسموع. الوضع الثاني (العكسي) يحول كلامك بالميكروفون أو كتابتك إلى إشارات مصرية متحركة ليفهمك الشخص الأصم.',
      },
      {
        label: 'افتح الكاميرا / العرض الحركي التوضيحي',
        detail:
          'زر «افتح الكاميرا» يشغل الكاميرا الفعلية للتعرف على حركاتك. وإذا لم تكن أمام الكاميرا، يمكنك الضغط على أي من الجمل الجاهزة في الأسفل لرؤية الحركة واختبار النتيجة فوراً.',
      },
      {
        label: 'زر «تحسين الإضاءة»',
        detail:
          'يرفع سطوع وتباين إطار الكاميرا برمجياً ويضاعف قدرة التتبع في الغرف المظلمة أو ذات الإضاءة الضعيفة (Low-Light Robustness).',
      },
      {
        label: 'أزرار «اسمع الجملة» و«نسخ النص» و«نطق صوتي تلقائي»',
        detail:
          '«اسمع الجملة» ينطق الترجمة فوراً بصوت واضح (يستخدم الصوت الذكي مع بديل تلقائي من صوت الجهاز لضمان التشغيل دائماً). «نسخ النص» ينسخ الجملة للحافظة. وتفعيل «نطق صوتي تلقائي» ينطق كل جملة جديدة مباشرة.',
      },
      {
        label: 'كوّن جملة بلمسة واحدة (+ أنا، + أريد...)',
        detail:
          'أزرار سريعة تتيح لك تجميع إشارات متتالية يدوياً ورؤية كيف يركّبها النظام في جملة عربية سليمة فوراً.',
      },
      {
        label: 'التنبيه الأصفر (كشف عدم اليقين)',
        detail:
          'عندما تكون الإضاءة ضعيفة جداً أو الحركة سريعة لدرجة التشويش أو نسبة الثقة أقل من الحد المطلوب، يتوقف النظام عن التخمين ويعرض تنبيهاً يطلب إعادة الإشارة بوضوح منعاً للأخطاء.',
      },
      {
        label: 'الإعدادات المتقدمة (الذكاء الاصطناعي والبحث العلمي)',
        detail:
          'تضم: شريط «سرعة النطق الصوتي» (0.75x إلى 1.25x)، وشريط «حساسية كشف عدم اليقين»، وزر «تحسين الصياغة السياقية» لإعادة بناء الجملة نحوياً، وزر «تسجيل في تجارب ISEF» لإضافة النتيجة لجدول البحث، ومؤشرات القياس (عدد المفاصل، شدة الإضاءة Lux، الوضوح %، وسرعة الاستجابة ms).',
      },
    ],
  },
  {
    id: 'dictionary',
    title: '3. شرح شاشة «قاموس الإشارات» (52 كلمة مصرية)',
    subtitle: 'البحث، التصنيفات، المعاينة ثلاثية الأبعاد المبسطة، والنطق الفوري',
    targetScreen: 'dictionary',
    targetLabel: 'افتح القاموس',
    icon: BookOpen,
    accent: 'fuchsia',
    items: [
      {
        label: 'مربع البحث الفوري',
        detail:
          'يمكنك البحث بالكلمة العربية (مثل: مدرسة)، أو الكلمة الإنجليزية (مثل: School)، أو حتى بوصف شكل اليد.',
      },
      {
        label: 'شريط التصنيفات والأعداد',
        detail:
          'يقسّم الإشارات إلى 5 مجموعات واضحة: تحيات، تعليم، طوارئ، حياة يومية، وضمائر وأفعال — مع عرض عدد الإشارات داخل كل قسم.',
      },
      {
        label: 'لوحة المعاينة التفصيلية',
        detail:
          'عند الضغط على أي بطاقة، يظهر الرسم الحركي لمسار اليدين مع 4 عناصر شرح: شكل اليد، طريقة الحركة، تعبير الوجه المطلوب، ومثال لاستخدام الكلمة في جملة، بالإضافة إلى زر «اسمع الكلمة».',
      },
      {
        label: 'زر السماعة المباشر على كل بطاقة',
        detail:
          'يسمح بنطق أي كلمة في القاموس مباشرة بضغطة واحدة دون الحاجة لفتح تفاصيلها.',
      },
    ],
  },
  {
    id: 'learning_progress',
    title: '4. شرح «وضع التدريب» ومستوى التقدم (XP والمستويات)',
    subtitle: 'كيف تتقن الإشارات وكيف ترتقي عبر المستويات الخمسة في الموقع',
    targetScreen: 'learning',
    targetLabel: 'ابدأ التدريب الآن',
    icon: Award,
    accent: 'cyan',
    items: [
      {
        label: 'شريط الدروس التفاعلي',
        detail:
          'يضم 8 إشارات أساسية متدرجة. الإشارات التي تتقنها يظهر بجانبها علامة صح وتُحفظ تلقائياً في جهازك.',
      },
      {
        label: 'خطوتان للتعلّم: الاختبار السريع ثم الكاميرا',
        detail:
          'أولاً تختبر فهمك لموضع الإشارة بالنسبة للجسم (الصدر، الوجه، الفضاء الأمامي...)، ثم يمكنك فتح الكاميرا لتمرين يدك ورؤية نسبة التطابق الفورية.',
      },
      {
        label: 'كيف تحصل على نقاط التقدم (XP)؟',
        detail:
          'كل تفاعل مفيد يرفع شريط مستوى التقدم أعلى الشاشة: سماع جملة أو كلمة (+10 نقاط)، تنفيذ ترجمة (+15 نقطة)، استكشاف كلمة جديدة في القاموس (+10 نقاط)، حفظ ترجمة (+20 نقطة)، تسجيل عينة بحثية (+25 نقطة)، وإتقان درس تدريبي (+40 نقطة).',
      },
      {
        label: 'المستويات الخمسة',
        detail:
          'تبدأ من المستوى 1 (مبتدئ في الإشارة: 0 نقطة) ← المستوى 2 (متواصل نشط: 100 نقطة) ← المستوى 3 (ممارس متقدم: 250 نقطة) ← المستوى 4 (سفير لغة الإشارة: 500 نقطة) ← المستوى 5 (خبير SignBridge: 900+ نقطة).',
      },
    ],
  },
  {
    id: 'history',
    title: '5. شرح شاشة «سجل الترجمات» والخصوصية',
    subtitle: 'إدارة الجمل المحفوظة، الموافقة المسبقة، وتصدير CSV',
    targetScreen: 'history',
    targetLabel: 'افتح السجل',
    icon: History,
    accent: 'cyan',
    items: [
      {
        label: 'حماية الخصوصية وعدم حفظ الفيديو',
        detail:
          'الكاميرا تعالج الإطارات لحظياً داخل المتصفح فقط ولا يتم رفع أو تخزين أي فيديو أو صور على الخادم نهائياً؛ يُحفظ النص المترجم فقط بعد موافقتك.',
      },
      {
        label: 'إعادة السماع والنسخ والحذف',
        detail:
          'كل بطاقة في السجل تحتوي على زر «اسمع» لإعادة نطق الجملة، وزر «نسخ»، وزر حذف مفرد، مع زر «مسح الكل» بالأعلى.',
      },
      {
        label: 'تصدير CSV',
        detail:
          'يحول جميع الترجمات المحفوظة مع نسب الثقة وزمن الاستجابة إلى ملف جدول بيانات (.csv) يدعم العربية لفتحه في Excel أو إرفاقه بالتقارير.',
      },
    ],
  },
  {
    id: 'research',
    title: '6. شرح «لوحة البحث العلمي (ISEF)» والمقاييس الأساسية',
    subtitle: 'شرح مفصل لعدم اليقين، Macro-F1، WER، زمن الترجمة، ومقارنة التعميم على أشخاص جدد',
    targetScreen: 'research',
    targetLabel: 'عرض لوحة البحث',
    icon: FlaskConical,
    accent: 'fuchsia',
    items: [
      {
        label: 'ما هو «عدم اليقين» (Uncertainty Detection) ومعدل الرفض؟',
        detail:
          'آلية أمان تمنع النظام من اختراع ترجمة خاطئة عندما تكون الإشارة غامضة. يتفعّل كشف عدم اليقين تلقائياً إذا انخفضت ثقة النموذج عن حد الأمان (افتراضياً 72%)، أو كانت حركة اليد سريعة جداً فتسبب ضبابية، أو الإضاءة شديدة الانخفاض. عندها يرفض النظام التخمين (وتُحسب هذه الحالات ضمن معدل الرفض الآمن Rejection Rate) ويظهر تنبيه أصفر يطلب إعادة الإشارة بوضوح حفاظاً على دقة التواصل.',
      },
      {
        label: 'ما هو معدل Macro-F1 (وPrecision وRecall)؟',
        detail:
          'مقياس إحصائي عادل يقيس أداء النموذج عبر جميع كلمات القاموس بالتساوي. Precision (الضبط) تعني: من بين كل المرات التي توقع فيها النظام كلمة معينة، كم مرة كان صحيحاً؟ وRecall (الاسترجاع) تعني: من كل المرات التي أدّى فيها الشخص الإشارة فعلاً، كم مرة نجح النظام في التقاطها؟ ويجمع معامل F1 بينهما بتوازن، ثم يحسب Macro-F1 متوسط F1 لكل إشارة من إشارات القاموس الـ 52 على حدة حتى لا تُخفي الكلمات الشائعة ضعف الكلمات النادرة.',
      },
      {
        label: 'ما هو معدل أخطاء الكلمات — WER (Word Error Rate)؟',
        detail:
          'مقياس يقيس دقة الجملة العربية الكاملة وليس الكلمة المنفردة؛ ويُحسب بقسمة (عدد الكلمات المُبدلة خطأ + المحذوفة + المضافة بالخطأ) على إجمالي كلمات الجملة الصحيحة × 100%. مثلاً: إذا كانت الجملة الصحيحة 5 كلمات وأسقط النموذج كلمة واحدة يكون WER = 20%. لذلك كلما كانت نسبة WER أقل كان الأداء أفضل، وتُظهر لوحة البحث أن الترجمة السياقية لتسلسل الإشارات تقلل WER بوضوح مقارنة بالترجمة الحرفية المنفصلة.',
      },
      {
        label: 'ما هو زمن الترجمة — Latency؟',
        detail:
          'هو الوقت المستغرق بوحدة الملي ثانية (ms — جزء من ألف من الثانية) من لحظة حركة اليد أمام الكاميرا حتى استخراج نقاط MediaPipe Holistic وتحليل التسلسل الزمني وظهور الترجمة العربية على الشاشة. كلما قلّ زمن الترجمة (أقل من 150 ms مقارنة بـ 1000 ms للثانية الواحدة) شعر المستخدم بأن التواصل فوري وطبيعي في الوقت الحقيقي.',
      },
      {
        label: 'ما هي مقارنة التعميم على أشخاص جدد (Signer Independence)؟',
        detail:
          'إذا اختُبر نموذج الذكاء الاصطناعي على فيديوهات لنفس الأشخاص الذين تدرّب عليهم فقد يحفظ شكل أيديهم أو ملابسهم فقط دون فهم الإشارة نفسها. لذلك نقسم المشاركين حسب الأشخاص: مجموعة تدريب (S01–S08) ومجموعة اختبار لأشخاص جدد لم يرهم النموذج مطلقاً (S09–S12). وتقارن اللوحة بين دقة نموذج اليد الثابتة فقط على الأشخاص الجدد مقابل دقة SignBridge AI على مجموعة التدريب وعلى الأشخاص الجدد لإثبات قدرة النظام على فهم أي شخص جديد.',
      },
      {
        label: 'Accuracy (الدقة الكلية) والتجارب الأربع وقواعد البيانات',
        detail:
          'Accuracy هي النسبة المئوية للتوقعات الصحيحة من إجمالي التجارب. وتختبر المنصة 4 تجارب علمية: (1) الدقة الأساسية، (2) الاستقلال عن الشخص، (3) الإضاءة المنخفضة والخلفيات المعقدة، (4) مقارنة الكلمات المنفردة بتسلسل الجمل، بالاعتماد على قاعدة البيانات المصرية Egyptian Sign Language Dataset (CC BY 4.0) وقاعدة ArabSign.',
      },
    ],
  },
  {
    id: 'pwa_audio',
    title: '7. التثبيت على الهاتف وحل مشكلات الصوت والكاميرا',
    subtitle: 'إرشادات تشغيل الصوت، الكاميرا، الميكروفون، والتطبيق بدون إنترنت',
    icon: Smartphone,
    accent: 'cyan',
    items: [
      {
        label: 'إذا لم تسمع الصوت عند الضغط على «اسمع الجملة»',
        detail:
          'تأكد من رفع مستوى صوت الوسائط في الهاتف أو الجهاز وإلغاء كتم المتصفح. النظام يستخدم محرك الصوت الذكي عبر الخادم أولاً ثم ينتقل تلقائياً لصوت المتصفح الاحتياطي ليتم نطق الكلام في كل الأحوال.',
      },
      {
        label: 'إذن الكاميرا والميكروفون',
        detail:
          'عند فتح الكاميرا أو الميكروفون لأول مرة، اضغط «سماح / Allow» في نافذة المتصفح. في حال رفضه سابقاً، افتح أيقونة القفل بجانب رابط الموقع وأعد تفعيل الإذن.',
      },
      {
        label: 'تثبيت الموقع كتطبيق على الموبايل (PWA)',
        detail:
          'في أجهزة Android/الكمبيوتر اضغط زر «تثبيت التطبيق» في الأعلى أو الأسفل. على iPhone افتح قائمة المشاركة في Safari واختر «إضافة إلى الشاشة الرئيسية». سيعمل القاموس والتدريب والمحاكي حتى بدون إنترنت.',
      },
    ],
  },
];

export const GuideView: React.FC<GuideViewProps> = ({
  readSectionIds,
  onMarkSectionRead,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    overview: true,
    translator: true,
    research: true,
  });

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.map((sec) => {
      const titleMatch =
        sec.title.toLowerCase().includes(q) || sec.subtitle.toLowerCase().includes(q);
      const matchingItems = sec.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q),
      );
      if (titleMatch) return sec;
      if (matchingItems.length > 0) return { ...sec, items: matchingItems };
      return null;
    }).filter((s): s is GuideSection => s !== null);
  }, [searchQuery]);

  const toggleSection = (id: string) => {
    setOpenIds((prev) => {
      const nextOpen = !prev[id];
      if (nextOpen) {
        onMarkSectionRead(id);
      }
      return { ...prev, [id]: nextOpen };
    });
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const sec of GUIDE_SECTIONS) {
      next[sec.id] = true;
      onMarkSectionRead(sec.id);
    }
    setOpenIds(next);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            الدليل الشامل لشرح كل تفصيلة في الموقع
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            شرح واضح لكل شاشة وزر ومؤشر علمي في SignBridge AI، مع روابط انتقال فورية للتجربة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الدليل... (مثال: الصوت، WER)"
              className="w-full rounded-xl border border-cyan-500/30 bg-[#0d1322] pr-9 pl-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 min-h-[40px]"
            />
          </div>
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-[#0d1322] text-xs font-medium text-cyan-300 hover:border-cyan-400 cursor-pointer min-h-[40px]"
          >
            فتح الكل
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0d1322] text-xs font-medium text-slate-300 hover:text-white cursor-pointer min-h-[40px]"
          >
            طي الكل
          </button>
        </div>
      </div>

      {/* Quick Feature Index Pills -> clean cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-[#0d1322] border border-cyan-500/25 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Volume2 className="w-4 h-4" />
            <span>النطق العربي</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            صوت ذكي واضح مع بديل تلقائي من صوت المتصفح.
          </p>
        </div>
        <div className="rounded-xl bg-[#0d1322] border border-fuchsia-500/25 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-fuchsia-300">
            <Camera className="w-4 h-4" />
            <span>ترجمة بالاتجاهين</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            من إشارة إلى كلام مسموع، ومن كلام إلى إشارة مرئية.
          </p>
        </div>
        <div className="rounded-xl bg-[#0d1322] border border-cyan-500/25 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Award className="w-4 h-4" />
            <span>مستوى التقدم</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            نقاط XP و5 مستويات تتحدث مع كل نشاط لك.
          </p>
        </div>
        <div className="rounded-xl bg-[#0d1322] border border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>أقسام الدليل المقروءة</span>
          </div>
          <p className="font-mono-tabular text-cyan-300 font-bold text-sm">
            {readSectionIds.length} / {GUIDE_SECTIONS.length}
          </p>
        </div>
      </div>

      {/* Accordion Guide Sections */}
      {filteredSections.length === 0 ? (
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-400">
          لا توجد نتائج مطابقة لبحثك في الدليل — جرّب كلمة أخرى.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isOpen = searchQuery.trim().length > 0 || Boolean(openIds[section.id]);
            const isRead = readSectionIds.includes(section.id);

            return (
              <div
                key={section.id}
                className={`bg-[#0d1322] border rounded-2xl overflow-hidden transition-colors ${
                  isOpen
                    ? section.accent === 'fuchsia'
                      ? 'border-fuchsia-500/40'
                      : 'border-cyan-500/40'
                    : 'border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-right cursor-pointer hover:bg-[#111a2e]/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        section.accent === 'fuchsia'
                          ? 'bg-fuchsia-950/50 border-fuchsia-500/35 text-fuchsia-300'
                          : 'bg-cyan-950/50 border-cyan-500/35 text-cyan-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-50">
                          {section.title}
                        </h2>
                        {isRead && (
                          <CheckCircle2
                            className="w-4 h-4 text-cyan-400 shrink-0"
                            aria-label="تمت قراءة هذا القسم"
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{section.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-slate-400 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {section.items.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-[#111a2e] border border-slate-800/90 p-3.5 space-y-1.5"
                        >
                          <div className="text-xs font-bold text-cyan-300">
                            {item.label}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    {section.targetScreen && section.targetLabel && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onNavigate(section.targetScreen!)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer"
                        >
                          <span>{section.targetLabel}</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
