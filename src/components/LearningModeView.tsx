import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Volume2,
} from 'lucide-react';
import { ESL_DICTIONARY } from '../data/eslLexicon';
import {
  createHolisticPipeline,
  drawHolisticOverlay,
  estimateFrameLuminance,
  speakArabicText,
  TemporalGestureTracker,
  type HolisticPipeline,
} from '../utils/holisticEngine';
import { KinematicSignCanvas } from './KinematicSignCanvas';

const PRACTICE_IDS = [
  'esl-01',
  'esl-04',
  'esl-05',
  'esl-23',
  'esl-13',
  'esl-16',
  'esl-33',
  'esl-44',
];

interface LearningModeViewProps {
  masteredIds: string[];
  onMasterSign: (id: string) => void;
  onRecordSpoken?: () => void;
}

export const LearningModeView: React.FC<LearningModeViewProps> = ({
  masteredIds,
  onMasterSign,
  onRecordSpoken,
}) => {
  const lessons = ESL_DICTIONARY.filter((d) => PRACTICE_IDS.includes(d.id));
  const [lessonIdx, setLessonIdx] = useState(0);
  const [speakingLesson, setSpeakingLesson] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [loadingCam, setLoadingCam] = useState(false);
  const [camMessage, setCamMessage] = useState<string | null>(null);
  const [liveMatchPct, setLiveMatchPct] = useState<number>(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipelineRef = useRef<HolisticPipeline | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const trackerRef = useRef(new TemporalGestureTracker());

  const currentLesson = lessons[lessonIdx] ?? lessons[0];
  const masteredCountInLessons = lessons.filter((l) => masteredIds.includes(l.id)).length;
  const masteryPct = Math.round((masteredCountInLessons / Math.max(1, lessons.length)) * 100);

  const markMastered = useCallback(
    (id: string) => {
      onMasterSign(id);
    },
    [onMasterSign],
  );

  const stopPracticeCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopPracticeCamera();
  }, [stopPracticeCamera]);

  const startPracticeCamera = async () => {
    setCamMessage(null);
    setLoadingCam(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('الكاميرا غير متوفرة في هذا المتصفح.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
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
      setLoadingCam(false);

      const loop = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const pipeline = pipelineRef.current;
        if (!video || !canvas || !pipeline || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const { luminanceMean } = estimateFrameLuminance(ctx, w, h);
        const now = performance.now();
        const handRes = pipeline.handLandmarker.detectForVideo(video, now);
        const poseRes = pipeline.poseLandmarker?.detectForVideo(video, now);
        const hands = handRes.landmarks ?? [];
        const pose = poseRes?.landmarks?.[0];
        drawHolisticOverlay(ctx, w, h, hands, pose, undefined);

        const evalRes = trackerRef.current.evaluateFrame(
          hands,
          pose,
          undefined,
          luminanceMean,
          true,
          68,
        );
        if (evalRes.handsDetected > 0) {
          const isMatch = evalRes.detectedGloss === currentLesson.glossAr;
          const score = isMatch ? evalRes.confidencePct : Math.max(25, evalRes.confidencePct - 25);
          setLiveMatchPct(score);
          if (isMatch && score >= 78) {
            markMastered(currentLesson.id);
          }
        } else {
          setLiveMatchPct(0);
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      setLoadingCam(false);
      stopPracticeCamera();
      setCamMessage(
        err instanceof Error
          ? `${err.message} — يمكنك استخدام الاختبار السريع بالأسفل لإتقان الإشارة.`
          : 'تعذر فتح الكاميرا — استخدم الاختبار السريع بالأسفل.',
      );
    }
  };

  const anchorOptions: Array<typeof currentLesson.bodyAnchor> = [
    'الصدر',
    'الوجه والذقن',
    'الفضاء الأمامي',
    'الجبهة',
    'الكتف',
  ];

  const handleQuizAnswer = (anchor: string) => {
    setQuizChoice(anchor);
    if (anchor === currentLesson.bodyAnchor) {
      setQuizFeedback('correct');
      markMastered(currentLesson.id);
    } else {
      setQuizFeedback('wrong');
    }
  };

  const handleSelectLesson = (idx: number) => {
    setLessonIdx(idx);
    setQuizChoice(null);
    setQuizFeedback(null);
    setLiveMatchPct(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            تعلّم الإشارات خطوة بخطوة
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            شاهد الحركة، جرّبها أمام الكاميرا أو اختبر فهمك لتثبيت الإشارات الأساسية.
          </p>
        </div>

        <div className="bg-[#0d1322] border border-cyan-500/30 rounded-xl px-4 py-2.5 min-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">تقدمك:</span>
            <span className="font-mono-tabular font-bold text-cyan-300">
              {masteredCountInLessons} / {lessons.length} ({masteryPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lesson Stepper Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {lessons.map((item, idx) => {
          const mastered = masteredIds.includes(item.id);
          const active = idx === lessonIdx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectLesson(idx)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[42px] ${
                active
                  ? 'border-cyan-400 bg-cyan-400 text-slate-950 font-bold neon-glow-cyan'
                  : mastered
                  ? 'border-cyan-500/40 bg-cyan-950/35 text-cyan-200'
                  : 'border-slate-800 bg-[#0d1322] text-slate-300 hover:border-cyan-500/30'
              }`}
            >
              {mastered && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{item.arabicWord}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">
                الدرس {lessonIdx + 1} من {lessons.length} · {currentLesson.category}
              </div>
              <h2 className="text-2xl font-bold text-cyan-300 mt-0.5">
                {currentLesson.arabicWord}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                onRecordSpoken?.();
                speakArabicText(
                  currentLesson.arabicWord,
                  1.0,
                  () => setSpeakingLesson(true),
                  () => setSpeakingLesson(false),
                );
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/35 bg-[#111a2e] text-xs font-medium text-cyan-200 hover:border-cyan-400 cursor-pointer min-h-[40px]"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>{speakingLesson ? 'ينطق...' : 'اسمع الكلمة'}</span>
            </button>
          </div>

          <KinematicSignCanvas
            pose={currentLesson.keyframePose}
            labelAr={currentLesson.arabicWord}
            subLabelAr={`موضع الإشارة: ${currentLesson.bodyAnchor}`}
            animate
            heightClass="h-64"
          />

          <div className="space-y-2 text-xs text-slate-300 bg-[#111a2e] border border-slate-800 rounded-xl p-4">
            <div>
              <span className="font-semibold text-slate-100">1. شكل اليد: </span>
              {currentLesson.handShapeAr}
            </div>
            <div>
              <span className="font-semibold text-slate-100">2. الحركة: </span>
              {currentLesson.motionTrajectoryAr}
            </div>
            <div>
              <span className="font-semibold text-slate-100">3. الوجه: </span>
              {currentLesson.facialCueAr}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => handleSelectLesson((lessonIdx - 1 + lessons.length) % lessons.length)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-[#111a2e] text-xs font-medium text-slate-200 hover:border-cyan-400 cursor-pointer min-h-[42px]"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectLesson((lessonIdx + 1) % lessons.length)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer min-h-[42px]"
            >
              <span>الدرس التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#0d1322] border border-fuchsia-500/25 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-50">
              1. اختبار سريع للفهم
            </h3>
            <p className="text-xs text-slate-300">
              أين تؤدَّى إشارة «{currentLesson.arabicWord}» بالنسبة للجسم؟
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {anchorOptions.map((anchor) => (
                <button
                  key={anchor}
                  type="button"
                  onClick={() => handleQuizAnswer(anchor)}
                  className={`px-3 py-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer min-h-[42px] ${
                    quizChoice === anchor
                      ? anchor === currentLesson.bodyAnchor
                        ? 'border-cyan-400 bg-cyan-950/45 text-cyan-200 font-semibold'
                        : 'border-rose-400 bg-rose-950/45 text-rose-200'
                      : 'border-slate-700 bg-[#111a2e] text-slate-300 hover:border-fuchsia-400'
                  }`}
                >
                  {anchor}
                </button>
              ))}
            </div>

            {quizFeedback === 'correct' && (
              <div className="rounded-xl border border-cyan-400/45 bg-cyan-950/40 p-3 text-xs text-cyan-200 font-medium">
                ممتاز! إجابة صحيحة — تم تسجيل إتقانك لإشارة «{currentLesson.arabicWord}».
              </div>
            )}
            {quizFeedback === 'wrong' && (
              <div className="rounded-xl border border-amber-400/45 bg-amber-950/40 p-3 text-xs text-amber-200">
                قريبة! انظر إلى مكان اليد في الرسم المتحرك وجرّب خياراً آخر.
              </div>
            )}
          </div>

          <div className="bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-50">
                  2. جرّبها أمام الكاميرا
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختياري: شغّل الكاميرا لقياس مدى تطابق حركتك مع الإشارة.
                </p>
              </div>
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => void startPracticeCamera()}
                  disabled={loadingCam}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer shrink-0 neon-glow-cyan min-h-[42px]"
                >
                  {loadingCam ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{loadingCam ? 'جاري الفتح...' : 'افتح الكاميرا'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopPracticeCamera}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500 text-slate-950 text-xs font-bold hover:bg-rose-400 cursor-pointer shrink-0 min-h-[42px]"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>إغلاق</span>
                </button>
              )}
            </div>

            {camMessage && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                {camMessage}
              </div>
            )}

            {cameraActive && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-[#060913] border border-cyan-500/30 aspect-video">
                  <video ref={videoRef} playsInline muted className="hidden" />
                  <canvas ref={canvasRef} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">نسبة التطابق:</span>
                  <span className="font-mono-tabular font-bold text-cyan-300">
                    {liveMatchPct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
