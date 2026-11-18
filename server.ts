import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import type {
  ExperimentTrialRecord,
  TranslationHistoryItem,
} from './src/types/signbridge.ts';
import {
  clearAllTranslationHistory,
  deleteTranslationHistoryById,
  getDb,
  insertExperimentTrial,
  insertTranslationHistory,
  listExperimentTrials,
  listTranslationHistory,
  resetExperimentTrials,
} from './server/database.ts';
import { computeResearchSummary } from './server/researchData.ts';
import { ESL_DICTIONARY } from './src/data/eslLexicon.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

function getGeminiClient(apiVersion?: string): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callWithTransientRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : 0;
      const msg = err instanceof Error ? err.message : '';
      const isTransient =
        status === 503 || status === 429 || msg.includes('503') || msg.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Initialize SQLite database on boot
  getDb();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'signbridge-ai', storage: 'sqlite' });
  });

  app.get('/api/research', (req, res) => {
    const allTrials = listExperimentTrials();
    const { experimentId, signerSplit } = req.query;

    let filtered = [...allTrials];
    if (typeof experimentId === 'string' && experimentId !== 'all') {
      filtered = filtered.filter((t) => t.experimentId === experimentId);
    }
    if (typeof signerSplit === 'string' && signerSplit !== 'all') {
      filtered = filtered.filter((t) => t.signerSplit === signerSplit);
    }

    const summary = computeResearchSummary(allTrials);
    res.json({
      trials: filtered,
      summary,
    });
  });

  app.post('/api/research/trials', (req, res) => {
    const body = req.body as Partial<ExperimentTrialRecord>;
    if (!body || !body.experimentId || !body.expectedSentenceAr) {
      res.status(400).json({ error: 'بيانات التجربة البحثية غير مكتملة.' });
      return;
    }

    const newTrial: ExperimentTrialRecord = {
      id: body.id || `tr-${Date.now()}`,
      experimentId: body.experimentId,
      signerId: body.signerId || 'S-LIVE',
      signerSplit: body.signerSplit || 'unseen_test',
      lightingCondition: body.lightingCondition || 'indoor_warm',
      mode: body.mode || 'continuous_sequence',
      expectedSentenceAr: body.expectedSentenceAr,
      predictedSentenceAr: body.predictedSentenceAr || body.expectedSentenceAr,
      rawGlosses: Array.isArray(body.rawGlosses) ? body.rawGlosses : [],
      confidencePct: Number(body.confidencePct ?? 90),
      precisionScore: Number(body.precisionScore ?? 91),
      recallScore: Number(body.recallScore ?? 90),
      werPct: Number(body.werPct ?? 5),
      latencyMs: Number(body.latencyMs ?? 110),
      rejectedAsUncertain: Boolean(body.rejectedAsUncertain),
      correctPrediction: body.correctPrediction !== false,
      timestamp: body.timestamp || new Date().toISOString(),
    };

    insertExperimentTrial(newTrial);
    const allTrials = listExperimentTrials();
    res.status(201).json({
      trial: newTrial,
      trials: allTrials,
      summary: computeResearchSummary(allTrials),
    });
  });

  app.post('/api/research/reset', (_req, res) => {
    const trials = resetExperimentTrials();
    res.json({
      trials,
      summary: computeResearchSummary(trials),
    });
  });

  app.get('/api/history', (_req, res) => {
    const items = listTranslationHistory();
    res.json({ items });
  });

  app.post('/api/history', (req, res) => {
    const body = req.body as Partial<TranslationHistoryItem>;
    if (!body?.consentConfirmed) {
      res.status(403).json({
        error: 'يتطلب حفظ الترجمات موافقة صريحة من المستخدم قبل التخزين في قاعدة البيانات.',
      });
      return;
    }
    if (!body.contextualSentenceAr && !body.rawLiteralAr) {
      res.status(400).json({ error: 'نص الترجمة مطلوب للحفظ.' });
      return;
    }

    const item: TranslationHistoryItem = {
      id: body.id || `hist-${Date.now()}`,
      glosses: Array.isArray(body.glosses) ? body.glosses : [],
      rawLiteralAr: body.rawLiteralAr || '',
      contextualSentenceAr: body.contextualSentenceAr || body.rawLiteralAr || '',
      confidencePct: Number(body.confidencePct ?? 0),
      rejectedAsUncertain: Boolean(body.rejectedAsUncertain),
      lightingLuxEstimate: Number(body.lightingLuxEstimate ?? 300),
      latencyMs: Number(body.latencyMs ?? 100),
      signerMode: body.signerMode || 'live_camera',
      consentConfirmed: true,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    insertTranslationHistory(item);
    res.status(201).json({ item, items: listTranslationHistory() });
  });

  app.delete('/api/history/:id', (req, res) => {
    const deleted = deleteTranslationHistoryById(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'السجل غير موجود.' });
      return;
    }
    res.json({ deletedId: req.params.id, items: listTranslationHistory() });
  });

  app.delete('/api/history', (_req, res) => {
    clearAllTranslationHistory();
    res.json({ items: [] });
  });

  app.post('/api/translate-context', async (req, res) => {
    try {
      const { glosses, confidencePct, lightingLux } = req.body as {
        glosses?: string[];
        confidencePct?: number;
        lightingLux?: number;
      };

      if (!Array.isArray(glosses) || glosses.length === 0) {
        res.status(400).json({ error: 'تسلسل الإشارات (glosses) مطلوب للترجمة السياقية.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `أنت وحدة التحليل السياقي للغة الإشارة المصرية في نظام SignBridge AI.
المهمة: تحويل تسلسل الإشارات الخام التالي إلى جملة عربية طبيعية مفهومة (مناسبة للنطق الصوتي)، مع تقييم مدى وضوح التسلسل السياقي.

المدخلات:
- تسلسل الإشارات الخام: ${JSON.stringify(glosses)}
- متوسط ثقة نموذج الحركة: ${confidencePct ?? 88}%
- تقدير الإضاءة (Lux): ${lightingLux ?? 320}

القواعد:
1. إذا كانت الرموز تحتوي على "؟" أو كانت الثقة أقل من 72%، فعّل uncertaintyTriggered = true ولا تخترع جملة، بل اطلب الإعادة بأدب بالعربية.
2. إذا كانت الإشارات واضحة، حوّلها إلى جملة عربية سليمة نحويًا (مثل تحويل ["أنا", "أريد", "ذهاب", "مدرسة"] إلى "أنا أريد الذهاب إلى المدرسة.").
3. اقترح التشكيل الجزئي المفيد للنطق الصوتي العربي السليم.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'أنت مترجم سياقي متخصص في لغة الإشارة المصرية والعربية الفصحى المبسطة. التزم بالإخراج JSON فقط.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fluentArabicSentence: {
                type: Type.STRING,
                description: 'الجملة العربية السليمة سياقيًا أو طلب الإعادة عند عدم اليقين',
              },
              uncertaintyTriggered: {
                type: Type.BOOLEAN,
                description: 'هل يجب رفض الترجمة وطلب الإعادة؟',
              },
              grammaticalNotesAr: {
                type: Type.STRING,
                description: 'ملاحظة لغوية موجزة حول ربط التسلسل السياقي',
              },
            },
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'لم يرجع النموذج استجابة صالحة.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({ result: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطأ أثناء الترجمة السياقية';
      if (message === 'MISSING_GEMINI_API_KEY') {
        res.status(503).json({
          error:
            'مفتاح GEMINI_API_KEY غير مضبوط على الخادم. يمكنك الاستمرار بالترجمة الفورية المحلية أو إضافة المفتاح في Settings > Secrets.',
        });
        return;
      }
      const status =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `تعذر إتمام التحليل السياقي المتقدم: ${message}`,
      });
    }
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voiceName } = req.body as {
        text?: string;
        voiceName?: string;
      };

      const cleanText = typeof text === 'string' ? text.trim() : '';
      if (!cleanText) {
        res.status(400).json({ error: 'النص مطلوب للتحويل إلى صوت.' });
        return;
      }

      const allowedVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
      const selectedVoice =
        typeof voiceName === 'string' && allowedVoices.includes(voiceName)
          ? voiceName
          : 'Kore';

      const ai = getGeminiClient('v1beta');
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText.slice(0, 600),
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(
        (p) => Boolean(p.inlineData?.data),
      );
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/wav';

      if (!base64Audio) {
        res.status(502).json({ error: 'لم يرجع نموذج الصوت بيانات صوتية صالحة.' });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطأ أثناء توليد الصوت';
      if (message === 'MISSING_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'مفتاح GEMINI_API_KEY غير مضبوط — سيتم استخدام صوت المتصفح الاحتياطي.',
        });
        return;
      }
      const status =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `تعذر توليد الصوت عبر الخادم: ${message}`,
      });
    }
  });

  app.post('/api/speech-to-sign', async (req, res) => {
    try {
      const { sentence } = req.body as { sentence?: string };
      const cleanSentence = typeof sentence === 'string' ? sentence.trim() : '';
      if (!cleanSentence) {
        res.status(400).json({ error: 'الجملة مطلوبة للترجمة إلى إشارات.' });
        return;
      }

      const dictionaryCatalog = ESL_DICTIONARY.map(
        (d) => `${d.id}:${d.glossAr}(${d.arabicWord})`,
      ).join(' | ');

      const ai = getGeminiClient();
      const prompt = `أنت خبير لغة الإشارة المصرية (Egyptian Sign Language) في نظام SignBridge AI.
المهمة: تحويل أي جملة عربية منطوقة أو مكتوبة (سواء بالعامية المصرية أو الفصحى) إلى تسلسل إشارات مرئي واضح خطوة بخطوة.

الجملة المدخلة:
"${cleanSentence.slice(0, 400)}"

القاموس المرجعي الموجود في النظام (استخدم matchedDictionaryId عند مطابقة المعنى حتى لو اختلفت اللهجة، مثل "عايز" -> esl-04، "اروح" -> esl-05، "ميه" -> esl-44، "مترو/محطة/شارع" -> esl-52):
${dictionaryCatalog}

القواعد:
1. حوّل الجملة كاملة ولا تترك أي معنى مهم دون إشارة، بترتيب لغة الإشارة المصرية الواضح (اسقط حروف الجر الزائدة مثل "في/إلى/عشان" إلا إذا كانت ضرورية للمعنى).
2. إذا طابقت الكلمة أو مرادفها العامي إحدى إشارات القاموس الـ 52، ضع معرفها في matchedDictionaryId (مثل "esl-04").
3. إذا لم تكن الكلمة في القاموس (مثل أسماء الأشخاص كـ"أحمد"، أو كلمات جديدة كـ"برمجة"، "شمس"، "قهوة"، "جميل")، اترك matchedDictionaryId فارغاً، واكتب وصفاً دقيقاً ومفهوماً لشكل اليد وحركتها وتعبير الوجه وموضع الجسم، واجعل isFingerspelled = true للأسماء والأعلام.`;

      const response: GenerateContentResponse = await callWithTransientRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'أنت مترجم خبير يحول أي كلام عربي أو مصري عامي إلى تسلسل إشارات لغة الإشارة المصرية بصيغة JSON دقيقة.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                eslStructureNoteAr: {
                  type: Type.STRING,
                  description: 'توضيح موجز لكيفية تحويل الجملة إلى قواعد لغة الإشارة المصرية',
                },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: {
                        type: Type.STRING,
                        description: 'الكلمة أو المفهوم الإشاري بالعربية',
                      },
                      matchedDictionaryId: {
                        type: Type.STRING,
                        description: 'معرف الإشارة في القاموس مثل esl-04 أو سلسلة فارغة إذا كانت إشارة مخصصة',
                      },
                      isFingerspelled: {
                        type: Type.BOOLEAN,
                        description: 'true للأسماء والأعلام التي تُهجّأ بالحروف',
                      },
                      handShapeAr: {
                        type: Type.STRING,
                        description: 'وصف واضح لشكل اليد والأصابع بالعربية',
                      },
                      motionTrajectoryAr: {
                        type: Type.STRING,
                        description: 'وصف مسار الحركة بالعربية',
                      },
                      facialCueAr: {
                        type: Type.STRING,
                        description: 'تعبير الوجه والحاجبين المصاحب للإشارة',
                      },
                      bodyAnchor: {
                        type: Type.STRING,
                        description: 'واحد من: الصدر | الوجه والذقن | الفضاء الأمامي | الجبهة | الكتف',
                      },
                      motionArc: {
                        type: Type.STRING,
                        description: 'واحد من: linear | circular | tap | wave | point',
                      },
                      twoHands: {
                        type: Type.BOOLEAN,
                        description: 'هل تستخدم الإشارة اليدين معاً؟',
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        res.status(502).json({ error: 'لم يرجع النموذج تسلسل إشارات صالحاً.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({ result: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطأ أثناء ترجمة الكلام إلى إشارة';
      if (message === 'MISSING_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'مفتاح GEMINI_API_KEY غير مضبوط على الخادم.',
        });
        return;
      }
      const status =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: `تعذر تحليل الجملة بالذكاء الاصطناعي: ${message}`,
      });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SignBridge AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SignBridge AI server:', err);
  process.exit(1);
});
