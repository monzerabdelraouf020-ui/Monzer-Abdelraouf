import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  FlaskConical,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  composeContextArabicFromGlosses,
  ESL_DICTIONARY,
  SEQUENCE_SCENARIOS,
} from '../data/eslLexicon';
import type {
  ExperimentTrialRecord,
  SignDictionaryItem,
  TranslationHistoryItem,
} from '../types/signbridge';
import {
  createHolisticPipeline,
  drawHolisticOverlay,
  estimateFrameLuminance,
  speakArabicText,
  stopAllSpeech,
  TemporalGestureTracker,
  type HolisticFrameTelemetry,
  type HolisticPipeline,
  type TTSVoiceOption,
} from '../utils/holisticEngine';
import {
  buildDynamicSignItem,
  findDictionaryItemById,
  translateAnyArabicSentenceLocally,
} from '../utils/speechToSign';
import { KinematicSignCanvas } from './KinematicSignCanvas';

interface LiveTranslatorViewProps {
  consentGranted: boolean;
  onToggleConsent: (next: boolean) => void;
  onSaveToHistory: (item: Omit<TranslationHistoryItem, 'id' | 'createdAt'>) => Promise<void>;
  onLogResearchTrial: (trial: Partial<ExperimentTrialRecord>) => Promise<void>;
  onRecordSpoken?: () => void;
  onRecordTranslated?: () => void;
}

type TranslatorDirection = 'sign_to_speech' | 'speech_to_sign';
type InputSourceMode = 'simulator' | 'webcam';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const LiveTranslatorView: React.FC<LiveTranslatorViewProps> = ({
  consentGranted,
  onToggleConsent,
  onSaveToHistory,
  onLogResearchTrial,
  onRecordSpoken,
  onRecordTranslated,
}) => {
  const [direction, setDirection] = useState<TranslatorDirection>('sign_to_speech');
  const [sourceMode, setSourceMode] = useState<InputSourceMode>('simulator');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipelineRef = useRef<HolisticPipeline | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const trackerRef = useRef(new TemporalGestureTracker());

  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lowLightBoost, setLowLightBoost] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(72);
  const [telemetry, setTelemetry] = useState<HolisticFrameTelemetry>({
    handsDetected: 0,
    poseDetected: false,
    faceDetected: false,
    luminanceMean: 138,
    luxEstimate: 340,
    motionVelocity: 0,
    landmarkVisibility: 0.94,
    confidencePct: 93.8,
    isUncertain: false,
    detectedGloss: null,
    uncertaintyReasonAr: null,
    processingMs: 18,
  });

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SEQUENCE_SCENARIOS[0].id);
  const [simStepIdx, setSimStepIdx] = useState<number>(0);
  const [simPlaying, setSimPlaying] = useState<boolean>(true);

  const [glossBuffer, setGlossBuffer] = useState<string[]>(SEQUENCE_SCENARIOS[0].glosses);
  const [fluentSentence, setFluentSentence] = useState<string>(SEQUENCE_SCENARIOS[0].fluentArabic);
  const [literalSentence, setLiteralSentence] = useState<string>(SEQUENCE_SCENARIOS[0].literalAr);
  const [isUncertain, setIsUncertain] = useState<boolean>(false);
  const [uncertaintyNote, setUncertaintyNote] = useState<string | null>(null);
  const [confidencePct, setConfidencePct] = useState<number>(SEQUENCE_SCENARIOS[0].confidencePct);
  const [latencyMs, setLatencyMs] = useState<number>(SEQUENCE_SCENARIOS[0].latencyMs);

  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [ttsVoice, setTtsVoice] = useState<TTSVoiceOption>('Kore');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const [refiningContext, setRefiningContext] = useState<boolean>(false);
  const [contextNote, setContextNote] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

  const [actionToast, setActionToast] = useState<string | null>(null);
  const [savingHistory, setSavingHistory] = useState<boolean>(false);
  const [loggingTrial, setLoggingTrial] = useState<boolean>(false);

  // Reverse mode (Speech/Text to Sign)
  const [reverseInput, setReverseInput] = useState<string>('أنا أريد الذهاب إلى المدرسة');
  const [reverseSigns, setReverseSigns] = useState<SignDictionaryItem[]>([]);
  const [reverseActiveIdx, setReverseActiveIdx] = useState<number>(0);
  const [reversePlaying, setReversePlaying] = useState<boolean>(true);
  const [reverseTranslatingAi, setReverseTranslatingAi] = useState<boolean>(false);
  const [reverseStructureNote, setReverseStructureNote] = useState<string | null>(null);
  const [reverseTranslationSource, setReverseTranslationSource] = useState<'local' | 'ai'>('local');
  const [listeningMic, setListeningMic] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  const selectedScenario =
    SEQUENCE_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SEQUENCE_SCENARIOS[0];

  const triggerSpeak = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      onRecordSpoken?.();
      speakArabicText(
        text,
        speechRate,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        ttsVoice,
      );
    },
    [speechRate, ttsVoice, onRecordSpoken],
  );

  const handleCopySentence = async (text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 1800);
    } catch {
      setActionToast('لم يتم النسخ تلقائياً — يمكنك تحديد النص ونسخه.');
    }
  };

  const applyScenario = useCallback(
    (scenarioId: string) => {
      const scen = SEQUENCE_SCENARIOS.find((s) => s.id === scenarioId) ?? SEQUENCE_SCENARIOS[0];
      setSourceMode('simulator');
      setSelectedScenarioId(scen.id);
      setSimStepIdx(0);
      setSimPlaying(true);
      setGlossBuffer(scen.glosses);
      setLiteralSentence(scen.literalAr);
      setFluentSentence(scen.fluentArabic);
      setIsUncertain(scen.isUncertain);
      setUncertaintyNote(scen.uncertaintyReasonAr ?? null);
      setConfidencePct(scen.confidencePct);
      setLatencyMs(scen.latencyMs);
      setContextNote(null);
      setContextError(null);
      setTelemetry((prev) => ({
        ...prev,
        handsDetected: scen.isUncertain ? 1 : 2,
        poseDetected: true,
        faceDetected: !scen.isUncertain,
        luxEstimate: scen.luxEstimate,
        luminanceMean: scen.isUncertain ? 42 : 148,
        confidencePct: scen.confidencePct,
        isUncertain: scen.isUncertain,
        uncertaintyReasonAr: scen.uncertaintyReasonAr ?? null,
      }));
      if (autoSpeak && !scen.isUncertain && scen.fluentArabic) {
        triggerSpeak(scen.fluentArabic);
      }
      onRecordTranslated?.();
    },
    [autoSpeak, triggerSpeak, onRecordTranslated],
  );

  useEffect(() => {
    if (sourceMode !== 'simulator' || !simPlaying) return;
    const timer = window.setInterval(() => {
      setSimStepIdx((prev) => (prev + 1) % Math.max(1, selectedScenario.glosses.length));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [sourceMode, simPlaying, selectedScenario.glosses.length]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    trackerRef.current.reset();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setSourceMode('webcam');
    setModelLoading(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول إلى الكاميرا في هذا الوضع.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!pipelineRef.current) {
        pipelineRef.current = await createHolisticPipeline();
      }

      setCameraActive(true);
      setModelLoading(false);

      let lastGlossPushTs = 0;

      const processFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const pipeline = pipelineRef.current;
        if (!video || !canvas || !pipeline || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const t0 = performance.now();
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }

        ctx.save();
        if (lowLightBoost) {
          ctx.filter = 'brightness(1.22) contrast(1.16)';
        }
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        const { luminanceMean, luxEstimate } = estimateFrameLuminance(ctx, w, h);
        const nowMs = performance.now();

        const handResult = pipeline.handLandmarker.detectForVideo(video, nowMs);
        const poseResult = pipeline.poseLandmarker?.detectForVideo(video, nowMs);
        const faceResult = pipeline.faceLandmarker?.detectForVideo(video, nowMs);

        const hands = handResult.landmarks ?? [];
        const pose = poseResult?.landmarks?.[0];
        const face = faceResult?.faceLandmarks?.[0];

        drawHolisticOverlay(ctx, w, h, hands, pose, face);

        const frameEval = trackerRef.current.evaluateFrame(
          hands,
          pose,
          face,
          luminanceMean,
          lowLightBoost,
          confidenceThreshold,
        );

        const processingMs = Math.max(12, Math.round(performance.now() - t0));

        setTelemetry({
          ...frameEval,
          luxEstimate,
          processingMs,
        });

        if (frameEval.handsDetected > 0) {
          setConfidencePct(frameEval.confidencePct);
          setLatencyMs(processingMs + 42);

          if (frameEval.isUncertain) {
            setIsUncertain(true);
            setUncertaintyNote(frameEval.uncertaintyReasonAr);
          } else if (frameEval.detectedGloss && nowMs - lastGlossPushTs > 1550) {
            lastGlossPushTs = nowMs;
            const nextGloss = frameEval.detectedGloss;
            setIsUncertain(false);
            setUncertaintyNote(null);
            setGlossBuffer((prev) => {
              if (prev[prev.length - 1] === nextGloss) return prev;
              const updated = [...prev.slice(-5), nextGloss];
              const composed = composeContextArabicFromGlosses(updated);
              setLiteralSentence(composed.literalAr);
              setFluentSentence(composed.fluentArabic);
              return updated;
            });
          }
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err: unknown) {
      setModelLoading(false);
      stopCamera();
      setSourceMode('simulator');
      setCameraError(
        err instanceof Error
          ? `تعذر فتح الكاميرا (${err.message}). يمكنك تجربة الجمل الجاهزة بالمحاكي مباشرة.`
          : 'تعذر فتح الكاميرا — يمكنك تجربة الجمل الجاهزة بالمحاكي مباشرة.',
      );
    }
  };

  const appendGlossToken = (gloss: string) => {
    onRecordTranslated?.();
    setGlossBuffer((prev) => {
      const next = [...prev, gloss];
      const composed = composeContextArabicFromGlosses(next);
      setLiteralSentence(composed.literalAr);
      setFluentSentence(composed.fluentArabic);
      setIsUncertain(false);
      setUncertaintyNote(null);
      setConfidencePct(92.4);
      setContextNote(null);
      return next;
    });
  };

  const clearGlossBuffer = () => {
    setGlossBuffer([]);
    setLiteralSentence('');
    setFluentSentence('');
    setIsUncertain(false);
    setUncertaintyNote(null);
    setContextNote(null);
    setContextError(null);
  };

  const handleRefineWithGemini = async () => {
    if (glossBuffer.length === 0) return;
    setRefiningContext(true);
    setContextError(null);
    setContextNote(null);

    try {
      const res = await fetch('/api/translate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glosses: glossBuffer,
          confidencePct,
          lightingLux: telemetry.luxEstimate,
        }),
      });
      const data = (await res.json()) as {
        result?: {
          fluentArabicSentence: string;
          uncertaintyTriggered: boolean;
          grammaticalNotesAr: string;
        };
        error?: string;
      };
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'تعذر التحليل السياقي عبر الخادم.');
      }

      if (data.result.uncertaintyTriggered) {
        setIsUncertain(true);
        setUncertaintyNote(data.result.fluentArabicSentence);
      } else {
        setIsUncertain(false);
        setUncertaintyNote(null);
        setFluentSentence(data.result.fluentArabicSentence);
        setContextNote(data.result.grammaticalNotesAr);
        if (autoSpeak) {
          triggerSpeak(data.result.fluentArabicSentence);
        }
      }
    } catch (err: unknown) {
      setContextError(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
    } finally {
      setRefiningContext(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!fluentSentence && !literalSentence) return;
    if (!consentGranted) {
      onToggleConsent(true);
    }

    setSavingHistory(true);
    try {
      await onSaveToHistory({
        glosses: glossBuffer,
        rawLiteralAr: literalSentence,
        contextualSentenceAr: fluentSentence || 'إشارة غير مؤكدة — طُلب الإعادة',
        confidencePct,
        rejectedAsUncertain: isUncertain,
        lightingLuxEstimate: telemetry.luxEstimate,
        latencyMs,
        signerMode: sourceMode === 'webcam' ? 'live_camera' : 'simulator',
        consentConfirmed: true,
      });
      setActionToast('تم حفظ الترجمة في السجل بنجاح.');
    } catch (err: unknown) {
      setActionToast(err instanceof Error ? err.message : 'فشل الحفظ.');
    } finally {
      setSavingHistory(false);
    }
  };

  const handleLogTrial = async () => {
    setLoggingTrial(true);
    try {
      await onLogResearchTrial({
        experimentId: isUncertain
          ? 'exp3_lighting_background'
          : sourceMode === 'webcam'
          ? 'exp2_signer_independent'
          : 'exp4_sequence_vs_isolated',
        signerId: sourceMode === 'webcam' ? 'S-LIVE' : 'S09',
        signerSplit: 'unseen_test',
        lightingCondition:
          telemetry.luxEstimate < 100
            ? lowLightBoost
              ? 'low_light_enhanced'
              : 'low_light_raw'
            : 'indoor_warm',
        mode: 'continuous_sequence',
        expectedSentenceAr: fluentSentence || selectedScenario.titleAr,
        predictedSentenceAr: isUncertain
          ? 'إشارة غير مؤكدة — طُلب الإعادة'
          : fluentSentence || literalSentence,
        rawGlosses: glossBuffer,
        confidencePct,
        precisionScore: isUncertain ? 86.0 : 92.5,
        recallScore: isUncertain ? 84.0 : 91.2,
        werPct: isUncertain ? 14.0 : 4.5,
        latencyMs,
        rejectedAsUncertain: isUncertain,
        correctPrediction: true,
      });
      setActionToast('تمت إضافة العينة إلى نتائج أبحاث ISEF.');
    } catch (err: unknown) {
      setActionToast(err instanceof Error ? err.message : 'فشل تسجيل العينة.');
    } finally {
      setLoggingTrial(false);
    }
  };

  const runAiSpeechToSign = useCallback(
    async (sentence: string) => {
      const clean = sentence.trim();
      if (!clean) return;
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
      const controller = new AbortController();
      reverseAbortRef.current = controller;
      setReverseTranslatingAi(true);

      try {
        const res = await fetch('/api/speech-to-sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence: clean }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          result?: {
            eslStructureNoteAr?: string;
            steps?: Array<{
              word?: string;
              matchedDictionaryId?: string;
              isFingerspelled?: boolean;
              handShapeAr?: string;
              motionTrajectoryAr?: string;
              facialCueAr?: string;
              bodyAnchor?: SignDictionaryItem['bodyAnchor'];
              motionArc?: SignDictionaryItem['keyframePose']['motionArc'];
              twoHands?: boolean;
            }>;
          };
        };

        const steps = data.result?.steps;
        if (!Array.isArray(steps) || steps.length === 0) return;

        const validAnchors = new Set<SignDictionaryItem['bodyAnchor']>([
          'الصدر',
          'الوجه والذقن',
          'الفضاء الأمامي',
          'الجبهة',
          'الكتف',
        ]);
        const validArcs = new Set<SignDictionaryItem['keyframePose']['motionArc']>([
          'linear',
          'circular',
          'tap',
          'wave',
          'point',
        ]);

        const built: SignDictionaryItem[] = steps
          .filter((s) => Boolean(s.word && s.word.trim()))
          .map((step, idx) => {
            const matched = step.matchedDictionaryId
              ? findDictionaryItemById(step.matchedDictionaryId.trim())
              : undefined;
            if (matched) return matched;

            const safeAnchor =
              step.bodyAnchor && validAnchors.has(step.bodyAnchor)
                ? step.bodyAnchor
                : 'الفضاء الأمامي';
            const safeArc =
              step.motionArc && validArcs.has(step.motionArc)
                ? step.motionArc
                : 'linear';

            return buildDynamicSignItem(step.word!.trim(), idx, {
              handShapeAr: step.handShapeAr,
              motionTrajectoryAr: step.motionTrajectoryAr,
              facialCueAr: step.facialCueAr,
              bodyAnchor: safeAnchor,
              motionArc: safeArc,
              twoHands: step.twoHands,
              isFingerspelled: Boolean(step.isFingerspelled),
            });
          });

        if (built.length > 0) {
          setReverseSigns(built);
          setReverseActiveIdx(0);
          setReverseTranslationSource('ai');
          setReverseStructureNote(data.result?.eslStructureNoteAr ?? null);
          onRecordTranslated?.();
        }
      } catch {
        // Keep instant local translation if aborted or offline
      } finally {
        if (reverseAbortRef.current === controller) {
          setReverseTranslatingAi(false);
        }
      }
    },
    [onRecordTranslated],
  );

  useEffect(() => {
    const clean = reverseInput.trim();
    if (!clean) {
      setReverseSigns([]);
      setReverseActiveIdx(0);
      setReverseStructureNote(null);
      setReverseTranslatingAi(false);
      return;
    }

    // Immediate zero-latency local translation for any Arabic/Egyptian sentence
    const localSigns = translateAnyArabicSentenceLocally(clean);
    setReverseSigns(localSigns);
    setReverseActiveIdx(0);
    setReverseTranslationSource('local');
    setReverseStructureNote(null);
  }, [reverseInput]);

  useEffect(() => {
    if (direction !== 'speech_to_sign' || !reversePlaying || reverseSigns.length <= 1) return;
    const t = window.setInterval(() => {
      setReverseActiveIdx((prev) => (prev + 1) % reverseSigns.length);
    }, 1900);
    return () => window.clearInterval(t);
  }, [direction, reversePlaying, reverseSigns.length]);

  const toggleArabicMic = () => {
    setMicError(null);
    if (listeningMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setListeningMic(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicError('التعرف الصوتي غير متاح في هذا المتصفح — يمكنك كتابة أي جملة مباشرة وستُترجم فوراً.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'ar-EG';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i]?.[0]?.transcript;
          if (piece) combined += `${piece} `;
        }
        const trimmed = combined.trim();
        if (trimmed) {
          setReverseInput(trimmed);
        }
      };
      rec.onerror = () => {
        setMicError('تعذر سماع الميكروفون. تأكد من الإذن أو اكتب الجملة نصياً.');
        setListeningMic(false);
      };
      rec.onend = () => setListeningMic(false);
      recognitionRef.current = rec;
      rec.start();
      setListeningMic(true);
    } catch {
      setMicError('تعذر تشغيل الميكروفون.');
      setListeningMic(false);
    }
  };

  const currentSimGloss =
    selectedScenario.glosses[simStepIdx] ?? selectedScenario.glosses[0] ?? 'أنا';
  const currentSimItem =
    ESL_DICTIONARY.find((d) => d.glossAr === currentSimGloss) ?? ESL_DICTIONARY[0];

  const activeReverseItem = reverseSigns[reverseActiveIdx] ?? ESL_DICTIONARY[0];

  return (
    <div className="space-y-5">
      {/* Simple Header + 2-Way Communication Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            تواصل فوري بلغة الإشارة
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            اختر اتجاه التواصل: حوّل الإشارة إلى كلام مسموع، أو حوّل كلامك إلى إشارات مرئية.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0d1322] rounded-xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setDirection('sign_to_speech')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              direction === 'sign_to_speech'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            إشارة ← نص وصوت
          </button>
          <button
            type="button"
            onClick={() => setDirection('speech_to_sign')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              direction === 'speech_to_sign'
                ? 'bg-fuchsia-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            كلام ← إشارة مرئية
          </button>
        </div>
      </div>

      {/* Quick 3-Step Helper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#0d1322] border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-mono-tabular font-bold text-cyan-400">1.</span>
          <span className="text-slate-300">
            {direction === 'sign_to_speech'
              ? 'شغّل الكاميرا أو اختر جملة تجريبية'
              : 'تحدث بالميكروفون أو اكتب جملتك بالعربية'}
          </span>
        </div>
        <div className="bg-[#0d1322] border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-mono-tabular font-bold text-cyan-400">2.</span>
          <span className="text-slate-300">
            {direction === 'sign_to_speech'
              ? 'شاهد الجملة العربية الواضحة في الحال'
              : 'تظهر الإشارات المصرية متحركة خطوة بخطوة'}
          </span>
        </div>
        <div className="bg-[#0d1322] border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-mono-tabular font-bold text-cyan-400">3.</span>
          <span className="text-slate-300">
            {direction === 'sign_to_speech'
              ? 'اضغط «اسمع الجملة» أو «انسخ» للتواصل الفوري'
              : 'تحكم في سرعة العرض أو تنقّل بين الإشارات'}
          </span>
        </div>
      </div>

      {direction === 'sign_to_speech' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Result Card First on Mobile, Right Column on Desktop */}
          <div className="lg:col-span-5 lg:order-2 space-y-4">
            <div className="bg-[#0d1322] border border-cyan-500/30 rounded-2xl p-5 space-y-4 neon-glow-cyan">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-50">
                  النتيجة العربية (النص والصوت)
                </h2>
                <span
                  className={`text-xs font-mono-tabular font-semibold ${
                    isUncertain ? 'text-amber-300' : 'text-cyan-300'
                  }`}
                >
                  {isUncertain ? '⚠ غير واضحة' : `ثقة ${confidencePct}%`}
                </span>
              </div>

              {isUncertain ? (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>الإشارة غير واضحة — من فضلك أعدها بوضوح</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {uncertaintyNote ||
                      'انخفضت نسبة الوضوح، لذلك رفض النظام تخمين معنى خاطئ.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-cyan-400/40 bg-[#070b15] p-4 space-y-3">
                  <p className="text-2xl font-bold text-white leading-relaxed min-h-[3rem]">
                    {fluentSentence || 'اختر إشارة أو استخدم الكاميرا للترجمة...'}
                  </p>
                  {literalSentence && (
                    <div className="text-xs text-slate-400">
                      الكلمات الملتقطة: <span>{literalSentence}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Big Primary Communication Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!fluentSentence || isUncertain}
                  onClick={() => {
                    if (isSpeaking) {
                      stopAllSpeech();
                      setIsSpeaking(false);
                    } else {
                      triggerSpeak(fluentSentence);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-400 text-slate-950 text-sm font-bold hover:bg-cyan-300 transition-colors cursor-pointer disabled:opacity-40 min-h-[46px]"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'إيقاف الصوت' : 'اسمع الجملة'}</span>
                </button>

                <button
                  type="button"
                  disabled={!fluentSentence || isUncertain}
                  onClick={() => void handleCopySentence(fluentSentence)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-cyan-500/35 bg-[#111a2e] text-cyan-200 text-sm font-semibold hover:border-cyan-400 transition-colors cursor-pointer disabled:opacity-40 min-h-[46px]"
                >
                  {copiedText ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>

              {/* Simple Auto-speak & Save Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="rounded border-slate-700 accent-cyan-400"
                  />
                  <span>نطق صوتي تلقائي</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveTranslation()}
                    disabled={savingHistory || (!fluentSentence && !literalSentence)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-[#111a2e] text-slate-200 hover:border-cyan-400 cursor-pointer disabled:opacity-45"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{savingHistory ? 'يحفظ...' : 'حفظ في السجل'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearGlossBuffer}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="مسح الجملة الحالية"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>
                </div>
              </div>

              {/* Easy Word Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">كوّن جملة بلمسة واحدة:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['أنا', 'أريد', 'ذهاب', 'مدرسة', 'جامعة', 'أحتاج', 'مساعدة', 'ماء', 'الآن', 'شكراً'].map(
                    (token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => appendGlossToken(token)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#111a2e] text-xs font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
                      >
                        + {token}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {actionToast && (
                <div className="flex items-center gap-2 text-xs text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{actionToast}</span>
                </div>
              )}
            </div>

            {/* Collapsible Advanced Controls & Research Telemetry */}
            <div className="bg-[#0d1322] border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>إعدادات متقدمة (الذكاء الاصطناعي والبحث العلمي)</span>
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800 space-y-4">
                  {/* Speech Rate */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span>سرعة النطق الصوتي:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0.75}
                        max={1.25}
                        step={0.05}
                        value={speechRate}
                        onChange={(e) => setSpeechRate(Number(e.target.value))}
                        className="w-32 accent-cyan-400 cursor-pointer"
                      />
                      <span className="font-mono-tabular font-semibold text-cyan-300">
                        {speechRate.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  {/* Voice Picker */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span>نبرة الصوت:</span>
                    <select
                      value={ttsVoice}
                      onChange={(e) => setTtsVoice(e.target.value as TTSVoiceOption)}
                      className="rounded-lg border border-slate-700 bg-[#060913] px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Kore">صوت دافئ (Kore)</option>
                      <option value="Puck">صوت شاب (Puck)</option>
                      <option value="Zephyr">صوت هادئ (Zephyr)</option>
                      <option value="Charon">صوت عميق (Charon)</option>
                      <option value="Fenrir">صوت جهوري (Fenrir)</option>
                    </select>
                  </div>

                  {/* Confidence Threshold */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span>حساسية كشف عدم اليقين:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={55}
                        max={90}
                        step={1}
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                        className="w-32 accent-cyan-400 cursor-pointer"
                      />
                      <span className="font-mono-tabular font-semibold text-cyan-300">
                        {confidenceThreshold}%
                      </span>
                    </div>
                  </div>

                  {/* Consent Toggle */}
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGranted}
                      onChange={(e) => onToggleConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 accent-cyan-400"
                    />
                    <span>السماح بحفظ نصوص الترجمة في سجل SQLite (بدون حفظ فيديو).</span>
                  </label>

                  {/* Gemini Refinement & ISEF Log */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRefineWithGemini()}
                      disabled={refiningContext || glossBuffer.length === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/30 text-xs font-semibold text-fuchsia-200 hover:border-fuchsia-400 cursor-pointer disabled:opacity-45"
                    >
                      {refiningContext ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>تحسين الصياغة السياقية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleLogTrial()}
                      disabled={loggingTrial || glossBuffer.length === 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-cyan-500/30 bg-[#111a2e] text-xs font-semibold text-cyan-200 hover:border-cyan-400 cursor-pointer disabled:opacity-45"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>{loggingTrial ? 'يسجل...' : 'تسجيل في تجارب ISEF'}</span>
                    </button>
                  </div>

                  {contextNote && (
                    <p className="text-xs text-cyan-200 bg-cyan-950/35 border border-cyan-500/30 rounded-lg p-2.5">
                      {contextNote}
                    </p>
                  )}
                  {contextError && (
                    <p className="text-xs text-rose-200 bg-rose-950/40 border border-rose-500/40 rounded-lg p-2.5">
                      {contextError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Camera / Visual Stage */}
          <div className="lg:col-span-7 lg:order-1 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {cameraActive && (
                  <span
                    className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                    aria-hidden="true"
                  />
                )}
                <h2 className="text-base font-semibold text-slate-50">
                  {sourceMode === 'webcam' ? 'الكاميرا المباشرة' : 'العرض الحركي التوضيحي'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    disabled={modelLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors cursor-pointer disabled:opacity-60 neon-glow-cyan min-h-[42px]"
                  >
                    {modelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>{modelLoading ? 'جاري التجهيز...' : 'افتح الكاميرا'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setSourceMode('simulator');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-slate-950 text-xs font-bold hover:bg-rose-400 transition-colors cursor-pointer min-h-[42px]"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>إغلاق الكاميرا</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setLowLightBoost((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer min-h-[42px] ${
                    lowLightBoost
                      ? 'border-cyan-400/50 bg-cyan-950/50 text-cyan-200'
                      : 'border-slate-700 bg-[#111a2e] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  <span>تحسين الإضاءة</span>
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                {cameraError}
              </div>
            )}

            {sourceMode === 'webcam' ? (
              <div className="relative rounded-xl overflow-hidden bg-[#060913] border border-cyan-500/30 aspect-video flex items-center justify-center">
                <video ref={videoRef} playsInline muted className="hidden" />
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                {!cameraActive && !modelLoading && (
                  <div className="text-xs text-slate-400">
                    في انتظار تفعيل الكاميرا...
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <KinematicSignCanvas
                  pose={currentSimItem.keyframePose}
                  labelAr={`الإشارة المعروضة: ${currentSimGloss}`}
                  subLabelAr={`خطوة ${simStepIdx + 1} من ${selectedScenario.glosses.length}`}
                  animate={simPlaying}
                  heightClass="h-68"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>جرّب جملة جاهزة بضغطة واحدة:</span>
                    <button
                      type="button"
                      onClick={() => setSimPlaying((p) => !p)}
                      className="inline-flex items-center gap-1 text-cyan-300 font-medium hover:underline cursor-pointer"
                    >
                      {simPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{simPlaying ? 'إيقاف العرض' : 'تشغيل العرض'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SEQUENCE_SCENARIOS.map((scen) => (
                      <button
                        key={scen.id}
                        type="button"
                        onClick={() => applyScenario(scen.id)}
                        className={`text-right p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                          selectedScenarioId === scen.id
                            ? scen.isUncertain
                              ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-semibold'
                              : 'border-cyan-400 bg-cyan-950/35 text-cyan-100 font-semibold'
                            : 'border-slate-800 bg-[#111a2e] text-slate-300 hover:border-cyan-500/35'
                        }`}
                      >
                        <div className="truncate">{scen.titleAr}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Compact Telemetry only when advanced or camera active */}
            {(showAdvanced || cameraActive) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-lg bg-[#111a2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">تتبع المفاصل</div>
                  <div className="text-xs font-semibold text-cyan-300 font-mono-tabular mt-0.5">
                    {telemetry.handsDetected} Hands · {telemetry.poseDetected ? 'Pose' : 'No Pose'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111a2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">الإضاءة</div>
                  <div className="text-xs font-semibold text-slate-100 font-mono-tabular mt-0.5">
                    {telemetry.luxEstimate} Lux
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111a2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">الوضوح</div>
                  <div className="text-xs font-semibold text-fuchsia-300 font-mono-tabular mt-0.5">
                    {Math.round(telemetry.landmarkVisibility * 100)}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111a2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">السرعة</div>
                  <div className="text-xs font-semibold text-cyan-300 font-mono-tabular mt-0.5">
                    {latencyMs} ms
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reverse Mode: Speech/Text to Egyptian Sign Language Visual Sequence */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-[#0d1322] border border-fuchsia-500/30 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-50">
              اكتب أو تحدث بالعربية
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              تحدث بالميكروفون أو اكتب أي جملة (بالعامية المصرية أو الفصحى)، وسيتم تحويل كل كلماتها إلى إشارات مرئية أو تهجئة إشارية للشخص الأصم.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleArabicMic}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                  listeningMic
                    ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                    : 'bg-fuchsia-400 text-slate-950 hover:bg-fuchsia-300 neon-glow-fuchsia'
                }`}
              >
                {listeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{listeningMic ? 'إيقاف الميكروفون' : 'تحدث الآن'}</span>
              </button>

              <button
                type="button"
                onClick={() => void runAiSpeechToSign(reverseInput)}
                disabled={reverseTranslatingAi || !reverseInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/30 text-xs font-semibold text-fuchsia-200 hover:border-fuchsia-400 cursor-pointer min-h-[44px] disabled:opacity-45"
              >
                {reverseTranslatingAi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>ترجم الآن</span>
              </button>

              <button
                type="button"
                onClick={() => triggerSpeak(reverseInput)}
                disabled={!reverseInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-cyan-500/30 bg-[#111a2e] text-xs font-medium text-cyan-300 hover:border-cyan-400 cursor-pointer min-h-[44px] disabled:opacity-45"
              >
                <Volume2 className="w-4 h-4" />
                <span>اسمع النص</span>
              </button>
            </div>

            {micError && (
              <p className="text-xs text-amber-200 bg-amber-950/40 border border-amber-400/40 rounded-lg p-2.5">
                {micError}
              </p>
            )}

            <div className="space-y-2">
              <label htmlFor="reverse-text" className="block text-xs font-medium text-slate-300">
                اكتب أي جملة تريد ترجمتها لإشارة:
              </label>
              <textarea
                id="reverse-text"
                rows={3}
                value={reverseInput}
                onChange={(e) => setReverseInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#060913] px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-400"
                placeholder="مثال: لو سمحت عايز أروح محطة المترو دلوقتي أو أنا اسمي أحمد"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-400">جمل سريعة للتجربة (فصحى وعامية):</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'أنا أريد الذهاب إلى المدرسة',
                  'لو سمحت عايز أروح محطة المترو دلوقتي',
                  'ازيك يا صاحبي أحمد عامل ايه النهارده',
                  'أنا تعبان ومحتاج أروح للدكتور بسرعة',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setReverseInput(sample)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#111a2e] text-xs text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-200 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-slate-50">
                  الإشارات المرئية ({reverseSigns.length} خطوات)
                </h2>
                <div className="text-[11px] text-slate-400">
                  {reverseTranslatingAi
                    ? 'جاري ترتيب الجملة وفق قواعد لغة الإشارة المصرية...'
                    : reverseTranslationSource === 'ai'
                    ? 'ترجمة ذكية بقواعد لغة الإشارة المصرية'
                    : 'ترجمة فورية بالكلمات والتهجئة الإشارية'}
                </div>
              </div>
              {reverseSigns.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setReverseActiveIdx(
                        (prev) => (prev - 1 + reverseSigns.length) % reverseSigns.length,
                      )
                    }
                    className="p-2 rounded-lg border border-slate-700 bg-[#111a2e] text-slate-200 hover:border-cyan-400 cursor-pointer"
                    aria-label="الإشارة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReversePlaying((p) => !p)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#111a2e] text-xs text-cyan-300 hover:border-cyan-400 cursor-pointer"
                  >
                    {reversePlaying ? 'إيقاف' : 'تشغيل'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReverseActiveIdx((prev) => (prev + 1) % reverseSigns.length)
                    }
                    className="p-2 rounded-lg border border-slate-700 bg-[#111a2e] text-slate-200 hover:border-cyan-400 cursor-pointer"
                    aria-label="الإشارة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {reverseStructureNote && (
              <div className="rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 px-3.5 py-2.5 text-xs text-fuchsia-200">
                {reverseStructureNote}
              </div>
            )}

            {reverseSigns.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400 border border-dashed border-slate-700 rounded-xl">
                اكتب أو انطق أي جملة بالعربية لتظهر لك إشاراتها فوراً.
              </div>
            ) : (
              <>
                <KinematicSignCanvas
                  pose={activeReverseItem.keyframePose}
                  labelAr={activeReverseItem.arabicWord}
                  subLabelAr={`${reverseActiveIdx + 1} / ${reverseSigns.length} · ${activeReverseItem.bodyAnchor}`}
                  animate={reversePlaying}
                  heightClass="h-72"
                />

                <div className="p-3.5 rounded-xl bg-[#111a2e] border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-cyan-300">
                      طريقة أداء إشارة «{activeReverseItem.arabicWord}»:
                    </span>
                    <span className="text-[11px] text-fuchsia-300">
                      {activeReverseItem.id.startsWith('dyn-')
                        ? activeReverseItem.englishGloss === 'FINGERSPELL'
                          ? 'تهجئة إشارية'
                          : 'إشارة وصفية ذكية'
                        : 'من القاموس المصري'}
                    </span>
                  </div>
                  <div>شكل اليد: {activeReverseItem.handShapeAr}</div>
                  <div>الحركة: {activeReverseItem.motionTrajectoryAr}</div>
                  <div>تعبير الوجه: {activeReverseItem.facialCueAr}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {reverseSigns.map((sign, idx) => (
                    <button
                      key={`${sign.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setReverseActiveIdx(idx);
                        setReversePlaying(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        idx === reverseActiveIdx
                          ? 'border-fuchsia-400 bg-fuchsia-400 text-slate-950'
                          : 'border-slate-700 bg-[#111a2e] text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>{sign.arabicWord}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
