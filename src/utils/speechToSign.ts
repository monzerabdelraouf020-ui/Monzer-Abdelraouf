import { ESL_DICTIONARY } from '../data/eslLexicon';
import type { KinematicKeyframe, SignDictionaryItem } from '../types/signbridge';

export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[،؟.!,؛:"'()\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const PHRASE_MAP: Array<{ pattern: string; ids: string[] }> = [
  { pattern: 'كيف حالك', ids: ['esl-14'] },
  { pattern: 'عامل ايه', ids: ['esl-14'] },
  { pattern: 'عامله ايه', ids: ['esl-14'] },
  { pattern: 'ازيك', ids: ['esl-13', 'esl-14'] },
  { pattern: 'صباح الخير', ids: ['esl-21'] },
  { pattern: 'مع السلامه', ids: ['esl-22'] },
  { pattern: 'من فضلك', ids: ['esl-17'] },
  { pattern: 'لو سمحت', ids: ['esl-17'] },
  { pattern: 'الحمد لله', ids: ['esl-15'] },
  { pattern: 'اهلا بك', ids: ['esl-13'] },
  { pattern: 'السلام عليكم', ids: ['esl-13'] },
  { pattern: 'شكرا جزيلا', ids: ['esl-16'] },
  { pattern: 'مش فاهم', ids: ['esl-20', 'esl-07'] },
  { pattern: 'لا افهم', ids: ['esl-20', 'esl-07'] },
  { pattern: 'عايز اروح', ids: ['esl-04', 'esl-05'] },
  { pattern: 'محتاج مساعده', ids: ['esl-06', 'esl-33'] },
];

const SYNONYM_TO_ID: Record<string, string> = {
  // Pronouns & Verbs
  انا: 'esl-01',
  نفسي: 'esl-01',
  انت: 'esl-02',
  انتي: 'esl-02',
  انتم: 'esl-02',
  حضرتك: 'esl-02',
  نحن: 'esl-03',
  احنا: 'esl-03',
  معا: 'esl-03',
  سوا: 'esl-03',
  اريد: 'esl-04',
  تريد: 'esl-04',
  يريد: 'esl-04',
  عايز: 'esl-04',
  عاوزه: 'esl-04',
  عايزه: 'esl-04',
  ابغي: 'esl-04',
  اتمني: 'esl-04',
  ذهاب: 'esl-05',
  الذهاب: 'esl-05',
  اذهب: 'esl-05',
  تذهب: 'esl-05',
  يذهب: 'esl-05',
  اروح: 'esl-05',
  تروح: 'esl-05',
  يروح: 'esl-05',
  نروح: 'esl-05',
  رايح: 'esl-05',
  رايحه: 'esl-05',
  ماشي: 'esl-05',
  احتاج: 'esl-06',
  نحتاج: 'esl-06',
  تحتاج: 'esl-06',
  محتاج: 'esl-06',
  محتاجه: 'esl-06',
  لازم: 'esl-06',
  ضروري: 'esl-06',
  فهم: 'esl-07',
  فهمت: 'esl-07',
  افهم: 'esl-07',
  فاهم: 'esl-07',
  واضح: 'esl-07',
  احب: 'esl-08',
  بحب: 'esl-08',
  تحب: 'esl-08',
  اعشق: 'esl-08',
  مفضل: 'esl-08',
  عمل: 'esl-09',
  شغل: 'esl-09',
  بشتغل: 'esl-09',
  اعمل: 'esl-09',
  وظيفه: 'esl-09',
  سؤال: 'esl-10',
  اسال: 'esl-10',
  بسأل: 'esl-10',
  ايه: 'esl-10',
  ليه: 'esl-10',
  لماذا: 'esl-10',
  فين: 'esl-10',
  اين: 'esl-10',
  ازاي: 'esl-10',
  كيف: 'esl-10',
  متي: 'esl-10',
  امتي: 'esl-10',
  كام: 'esl-10',
  كم: 'esl-10',
  هل: 'esl-10',
  ماذا: 'esl-10',
  مين: 'esl-10',
  ممكن: 'esl-11',
  ينفع: 'esl-11',
  اقدر: 'esl-11',
  تقدر: 'esl-11',
  استطيع: 'esl-11',
  انتظر: 'esl-12',
  استني: 'esl-12',
  اصبر: 'esl-12',
  لحظه: 'esl-12',
  ثواني: 'esl-12',
  شويه: 'esl-12',

  // Greetings
  اهلا: 'esl-13',
  مرحبا: 'esl-13',
  سلام: 'esl-13',
  ازيكم: 'esl-13',
  هاي: 'esl-13',
  اخبارك: 'esl-14',
  احوالك: 'esl-14',
  بخير: 'esl-15',
  كويس: 'esl-15',
  كويسه: 'esl-15',
  تمام: 'esl-15',
  طيب: 'esl-15',
  جيد: 'esl-15',
  ممتاز: 'esl-15',
  شكرا: 'esl-16',
  متشكر: 'esl-16',
  تسلم: 'esl-16',
  ممنون: 'esl-16',
  جزيلا: 'esl-16',
  فضلك: 'esl-17',
  ارجوك: 'esl-17',
  اسف: 'esl-18',
  معلش: 'esl-18',
  اعذرني: 'esl-18',
  عفوا: 'esl-18',
  عذرا: 'esl-18',
  نعم: 'esl-19',
  ايوه: 'esl-19',
  ايوة: 'esl-19',
  اه: 'esl-19',
  صح: 'esl-19',
  اكيد: 'esl-19',
  حاضر: 'esl-19',
  موافق: 'esl-19',
  لا: 'esl-20',
  مش: 'esl-20',
  مفيش: 'esl-20',
  مافيش: 'esl-20',
  ابدا: 'esl-20',
  صباح: 'esl-21',
  وداعا: 'esl-22',
  باي: 'esl-22',
  سلامات: 'esl-22',

  // Education
  مدرسه: 'esl-23',
  المدرسه: 'esl-23',
  فصل: 'esl-23',
  درس: 'esl-23',
  حصه: 'esl-23',
  جامعه: 'esl-24',
  الجامعه: 'esl-24',
  كليه: 'esl-24',
  معهد: 'esl-24',
  كتاب: 'esl-25',
  الكتاب: 'esl-25',
  كتب: 'esl-25',
  قصه: 'esl-25',
  معلم: 'esl-26',
  المعلم: 'esl-26',
  استاذ: 'esl-26',
  مدرس: 'esl-26',
  طالب: 'esl-27',
  تلميذ: 'esl-27',
  قراءه: 'esl-28',
  اقرا: 'esl-28',
  نقرا: 'esl-28',
  كتابه: 'esl-29',
  اكتب: 'esl-29',
  نكتب: 'esl-29',
  امتحان: 'esl-30',
  اختبار: 'esl-30',
  علم: 'esl-31',
  علوم: 'esl-31',
  العلوم: 'esl-31',
  تكنولوجيا: 'esl-31',
  حاسوب: 'esl-32',
  كمبيوتر: 'esl-32',
  لابتوب: 'esl-32',
  برمجه: 'esl-32',
  موقع: 'esl-32',

  // Emergency & Medical
  مساعده: 'esl-33',
  ساعدني: 'esl-33',
  ساعد: 'esl-33',
  تساعدني: 'esl-33',
  نجده: 'esl-33',
  طبيب: 'esl-34',
  دكتور: 'esl-34',
  الطبيب: 'esl-34',
  طبيه: 'esl-34',
  مستشفي: 'esl-35',
  المستشفي: 'esl-35',
  عياده: 'esl-35',
  اسعاف: 'esl-35',
  طوارئ: 'esl-36',
  عاجل: 'esl-36',
  بسرعه: 'esl-36',
  فورا: 'esl-36',
  الم: 'esl-37',
  وجع: 'esl-37',
  تعبان: 'esl-37',
  مريض: 'esl-37',
  مرض: 'esl-37',
  دواء: 'esl-38',
  الدواء: 'esl-38',
  علاج: 'esl-38',
  صيدليه: 'esl-38',
  خطر: 'esl-39',
  احذر: 'esl-39',
  انتبه: 'esl-39',
  شرطه: 'esl-40',
  بوليس: 'esl-40',
  اتصال: 'esl-41',
  اتصل: 'esl-41',
  مكالمه: 'esl-41',
  موبايل: 'esl-41',
  تليفون: 'esl-41',
  هاتف: 'esl-41',
  اكلم: 'esl-41',
  تواصل: 'esl-41',

  // Daily life
  الان: 'esl-42',
  دلوقتي: 'esl-42',
  حالا: 'esl-42',
  بيت: 'esl-43',
  البيت: 'esl-43',
  منزل: 'esl-43',
  شقه: 'esl-43',
  دار: 'esl-43',
  ماء: 'esl-44',
  مياه: 'esl-44',
  ميه: 'esl-44',
  اشرب: 'esl-44',
  عطشان: 'esl-44',
  طعام: 'esl-45',
  اكل: 'esl-45',
  باكل: 'esl-45',
  جعان: 'esl-45',
  فطار: 'esl-45',
  غداء: 'esl-45',
  عشاء: 'esl-45',
  شاي: 'esl-45',
  قهوه: 'esl-45',
  اسره: 'esl-46',
  عائله: 'esl-46',
  عيله: 'esl-46',
  اهلي: 'esl-46',
  بابا: 'esl-46',
  ماما: 'esl-46',
  ابي: 'esl-46',
  امي: 'esl-46',
  اخي: 'esl-46',
  اختي: 'esl-46',
  صديق: 'esl-47',
  صاحبي: 'esl-47',
  زميلي: 'esl-47',
  اصدقاء: 'esl-47',
  اليوم: 'esl-48',
  النهارده: 'esl-48',
  غدا: 'esl-49',
  بكره: 'esl-49',
  وقت: 'esl-50',
  ساعه: 'esl-50',
  الساعه: 'esl-50',
  الوقت: 'esl-50',
  سعيد: 'esl-51',
  فرحان: 'esl-51',
  مبسوط: 'esl-51',
  مواصلات: 'esl-52',
  مترو: 'esl-52',
  اتوبيس: 'esl-52',
  ميكروباص: 'esl-52',
  عربيه: 'esl-52',
  سياره: 'esl-52',
  تاكسي: 'esl-52',
  قطار: 'esl-52',
  محطه: 'esl-52',
  طريق: 'esl-52',
  شارع: 'esl-52',
};

const STOP_WORDS = new Set([
  'في',
  'علي',
  'الي',
  'من',
  'عن',
  'مع',
  'يا',
  'و',
  'او',
  'ان',
  'اللي',
  'ده',
  'دي',
  'دول',
  'هذا',
  'هذه',
  'علشان',
  'عشان',
  'بس',
  'يعني',
  'جدا',
  'خالص',
  'لك',
  'لي',
  'لنا',
  'بكل',
  'كل',
]);

export function findDictionaryItemById(id: string): SignDictionaryItem | undefined {
  return ESL_DICTIONARY.find((item) => item.id === id);
}

export function buildDynamicSignItem(
  word: string,
  idx: number,
  options?: {
    handShapeAr?: string;
    motionTrajectoryAr?: string;
    facialCueAr?: string;
    bodyAnchor?: SignDictionaryItem['bodyAnchor'];
    motionArc?: KinematicKeyframe['motionArc'];
    twoHands?: boolean;
    isFingerspelled?: boolean;
  },
): SignDictionaryItem {
  const letters = word
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '')
    .split('')
    .filter(Boolean);

  const fingerspellText =
    letters.length > 0 ? letters.join(' · ') : word;

  const isFingerspelled = options?.isFingerspelled ?? true;
  const seed = word.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + idx * 17;
  const rx = 0.4 + ((seed % 14) - 7) * 0.012;
  const ry = 0.45 + (((seed >> 2) % 12) - 6) * 0.014;
  const openness = 0.35 + ((seed % 5) * 0.12);
  const arcs: KinematicKeyframe['motionArc'][] = ['linear', 'circular', 'wave', 'tap', 'point'];
  const motionArc = options?.motionArc ?? arcs[seed % arcs.length];
  const twoHands = options?.twoHands ?? word.length >= 5;

  return {
    id: `dyn-${idx}-${word}`,
    glossAr: word,
    arabicWord: word,
    englishGloss: isFingerspelled ? 'FINGERSPELL' : 'CUSTOM SIGN',
    category: 'حياة يومية',
    difficulty: 'متوسط',
    datasetSource: 'توسيع ميداني بموافقة المشاركين',
    handShapeAr:
      options?.handShapeAr ||
      `تهجئة إشارية عربية للحروف: ${fingerspellText}`,
    motionTrajectoryAr:
      options?.motionTrajectoryAr ||
      `تشكيل حروف «${word}» بالتتابع في الفضاء الأمامي بإيقاع واضح`,
    facialCueAr:
      options?.facialCueAr ||
      'تواصل بصري واضح ونطق صامت بالكلمة لمساعدة الشخص الأصم على قراءة الشفاه',
    bodyAnchor: options?.bodyAnchor || 'الفضاء الأمامي',
    exampleSentenceAr: word,
    keyframePose: {
      rightHand: {
        x: rx,
        y: ry,
        openness,
        dx: ((seed % 7) - 3) * 0.025,
        dy: (((seed >> 3) % 7) - 3) * 0.02,
      },
      leftHand: {
        x: 0.62,
        y: 0.64,
        openness: 0.45,
        dx: 0.03,
        dy: -0.02,
        active: twoHands,
      },
      headTiltDeg: ((seed % 5) - 2) * 1.5,
      browRaise: word.includes('؟') ? 0.45 : 0.15,
      shoulderLift: 0.03,
      motionArc,
    },
  };
}

function matchSingleNormalizedWord(normWord: string): SignDictionaryItem | undefined {
  if (!normWord) return undefined;

  const directId = SYNONYM_TO_ID[normWord];
  if (directId) {
    return findDictionaryItemById(directId);
  }

  // Try stripping common Arabic prefixes (و، ف، ب، ل، ك، ال)
  const strippedPrefixes = [
    normWord.replace(/^ال/, ''),
    normWord.replace(/^[وفبلك]/, ''),
    normWord.replace(/^[وفبلك]ال/, ''),
  ];

  for (const variant of strippedPrefixes) {
    if (variant && SYNONYM_TO_ID[variant]) {
      return findDictionaryItemById(SYNONYM_TO_ID[variant]);
    }
  }

  return ESL_DICTIONARY.find((item) => {
    const nWord = normalizeArabic(item.arabicWord);
    const nGloss = normalizeArabic(item.glossAr);
    return (
      nWord === normWord ||
      nGloss === normWord ||
      nWord.replace(/^ال/, '') === normWord.replace(/^ال/, '')
    );
  });
}

export function translateAnyArabicSentenceLocally(sentence: string): SignDictionaryItem[] {
  const cleaned = sentence.trim();
  if (!cleaned) return [];

  let workingNorm = normalizeArabic(cleaned);
  if (!workingNorm) return [];

  // Replace known multi-word idioms with placeholder tokens
  const phraseTokens: Record<string, { ids: string[]; wordCount: number }> = {};
  PHRASE_MAP.forEach((phrase, idx) => {
    if (workingNorm.includes(phrase.pattern)) {
      const token = `__PHRASE_${idx}__`;
      phraseTokens[token] = {
        ids: phrase.ids,
        wordCount: phrase.pattern.split(' ').length,
      };
      workingNorm = workingNorm.replace(phrase.pattern, ` ${token} `);
    }
  });

  const rawOriginalWords = cleaned
    .replace(/[،؟.!,؛:"'()\-_/\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const normTokens = workingNorm.split(/\s+/).filter(Boolean);
  const results: SignDictionaryItem[] = [];
  let origIdx = 0;

  for (let i = 0; i < normTokens.length; i++) {
    const tok = normTokens[i];
    if (tok.startsWith('__PHRASE_') && phraseTokens[tok]) {
      for (const id of phraseTokens[tok].ids) {
        const found = findDictionaryItemById(id);
        if (found) results.push(found);
      }
      origIdx += phraseTokens[tok].wordCount;
      continue;
    }

    const originalWord =
      rawOriginalWords[Math.min(origIdx, Math.max(0, rawOriginalWords.length - 1))] || tok;
    origIdx++;

    const matched = matchSingleNormalizedWord(tok);
    if (matched) {
      results.push(matched);
      continue;
    }

    // Skip silent connector particles when there are other meaningful signs
    if (STOP_WORDS.has(tok) && normTokens.length > 1) {
      continue;
    }

    // For ANY other word (names, dialects, technical words), produce a full fingerspelling/custom sign!
    results.push(buildDynamicSignItem(originalWord, results.length));
  }

  // Fallback if sentence only contained stop words
  if (results.length === 0 && rawOriginalWords.length > 0) {
    return rawOriginalWords.map((w, idx) => buildDynamicSignItem(w, idx));
  }

  return results;
}
