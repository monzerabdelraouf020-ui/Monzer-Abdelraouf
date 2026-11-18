import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import { ESL_DICTIONARY } from '../data/eslLexicon';
import type { SignDictionaryItem } from '../types/signbridge';

export interface HolisticFrameTelemetry {
  handsDetected: number;
  poseDetected: boolean;
  faceDetected: boolean;
  luminanceMean: number; // 0..255
  luxEstimate: number;
  motionVelocity: number;
  landmarkVisibility: number; // 0..1
  confidencePct: number;
  isUncertain: boolean;
  detectedGloss: string | null;
  uncertaintyReasonAr: string | null;
  processingMs: number;
}

export interface HolisticPipeline {
  handLandmarker: HandLandmarker;
  poseLandmarker: PoseLandmarker | null;
  faceLandmarker: FaceLandmarker | null;
}

const MEDIAPIPE_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';

const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function createHolisticPipeline(): Promise<HolisticPipeline> {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_ROOT);

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  let poseLandmarker: PoseLandmarker | null = null;
  let faceLandmarker: FaceLandmarker | null = null;

  try {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  } catch {
    poseLandmarker = null;
  }

  try {
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
    });
  } catch {
    faceLandmarker = null;
  }

  return { handLandmarker, poseLandmarker, faceLandmarker };
}

export function estimateFrameLuminance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): { luminanceMean: number; luxEstimate: number } {
  const sampleW = Math.min(96, width);
  const sampleH = Math.min(72, height);
  if (sampleW <= 0 || sampleH <= 0) {
    return { luminanceMean: 128, luxEstimate: 300 };
  }
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  let sum = 0;
  const step = 16;
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    count++;
  }
  const mean = count > 0 ? sum / count : 128;
  const luxEstimate = Math.round(Math.pow(mean / 255, 1.65) * 650 + 18);
  return { luminanceMean: Math.round(mean), luxEstimate };
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const UPPER_POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
];

export function drawHolisticOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hands: NormalizedLandmark[][],
  pose: NormalizedLandmark[] | undefined,
  face: NormalizedLandmark[] | undefined,
): void {
  // Upper-body pose skeleton (shoulders & arms)
  if (pose && pose.length > 16) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2.6;
    for (const [a, b] of UPPER_POSE_CONNECTIONS) {
      const pa = pose[a];
      const pb = pose[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.stroke();
    }
    for (const idx of [11, 12, 13, 14, 15, 16]) {
      const pt = pose[idx];
      if (!pt) continue;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Key facial expression landmarks (brows, eyes, mouth contour)
  if (face && face.length > 300) {
    const faceSubset = [10, 33, 61, 133, 152, 263, 291, 362, 70, 105, 300, 334, 13, 14];
    ctx.fillStyle = 'rgba(232, 121, 249, 0.95)';
    for (const idx of faceSubset) {
      const pt = face[idx];
      if (!pt) continue;
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hand 21-point kinematic skeletons
  for (let h = 0; h < hands.length; h++) {
    const hand = hands[h];
    ctx.strokeStyle = h === 0 ? '#00f5d4' : '#e879f9';
    ctx.lineWidth = 2.6;
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = hand[a];
      const pb = hand[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.stroke();
    }
    for (let i = 0; i < hand.length; i++) {
      const pt = hand[i];
      const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      ctx.fillStyle = isTip ? '#00f5d4' : '#07090f';
      ctx.strokeStyle = h === 0 ? '#22d3ee' : '#e879f9';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, isTip ? 4.4 : 2.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

interface MotionSample {
  wristX: number;
  wristY: number;
  openness: number;
  ts: number;
}

export class TemporalGestureTracker {
  private window: MotionSample[] = [];
  private readonly maxFrames = 14;

  reset(): void {
    this.window = [];
  }

  evaluateFrame(
    hands: NormalizedLandmark[][],
    pose: NormalizedLandmark[] | undefined,
    face: NormalizedLandmark[] | undefined,
    luminanceMean: number,
    lowLightBoostEnabled: boolean,
    confidenceThreshold = 72,
  ): Omit<HolisticFrameTelemetry, 'luxEstimate' | 'processingMs'> {
    const handsDetected = hands.length;
    const poseDetected = Boolean(pose && pose.length > 14);
    const faceDetected = Boolean(face && face.length > 100);

    if (handsDetected === 0) {
      this.window = [];
      return {
        handsDetected: 0,
        poseDetected,
        faceDetected,
        luminanceMean,
        motionVelocity: 0,
        landmarkVisibility: poseDetected ? 0.35 : 0.08,
        confidencePct: 0,
        isUncertain: false,
        detectedGloss: null,
        uncertaintyReasonAr: null,
      };
    }

    const primary = hands[0];
    const wrist = primary[0];
    const thumbTip = primary[4];
    const indexTip = primary[8];
    const pinkyTip = primary[20];
    const middleBase = primary[9];

    const handScale = Math.max(
      0.04,
      Math.hypot(middleBase.x - wrist.x, middleBase.y - wrist.y),
    );
    const spread = Math.hypot(thumbTip.x - pinkyTip.x, thumbTip.y - pinkyTip.y);
    const indexExt = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const openness = Math.min(1, Math.max(0, (spread / handScale - 0.5) * 0.7));

    const now = performance.now();
    this.window.push({ wristX: wrist.x, wristY: wrist.y, openness, ts: now });
    if (this.window.length > this.maxFrames) {
      this.window.shift();
    }

    let dx = 0;
    let dy = 0;
    let velocity = 0;
    if (this.window.length >= 4) {
      const first = this.window[0];
      const last = this.window[this.window.length - 1];
      dx = last.wristX - first.wristX;
      dy = last.wristY - first.wristY;
      const dt = Math.max(0.05, (last.ts - first.ts) / 1000);
      velocity = Number((Math.hypot(dx, dy) / dt).toFixed(2));
    }

    // Check lighting quality & landmark visibility
    const effectiveLuminance = lowLightBoostEnabled
      ? Math.min(220, luminanceMean * 1.65 + 24)
      : luminanceMean;

    const lightingPenalty = effectiveLuminance < 52 ? 28 : effectiveLuminance < 75 ? 12 : 0;
    const visibility = Math.min(
      1,
      (handsDetected > 0 ? 0.55 : 0) + (poseDetected ? 0.25 : 0) + (faceDetected ? 0.2 : 0),
    );

    // Match against Egyptian Sign Language kinematic prototypes
    let bestItem: SignDictionaryItem | null = null;
    let bestDistance = Infinity;
    let secondBestDistance = Infinity;

    for (const item of ESL_DICTIONARY) {
      const target = item.keyframePose.rightHand;
      const posDist = Math.hypot(wrist.x - target.x, wrist.y - target.y);
      const openDist = Math.abs(openness - target.openness) * 0.45;
      const twoHandPenalty = item.keyframePose.leftHand.active && handsDetected < 2 ? 0.16 : 0;
      const indexPointBonus =
        item.keyframePose.motionArc === 'point' && indexExt / handScale > 1.35 ? -0.06 : 0;

      const totalDist = posDist + openDist + twoHandPenalty + indexPointBonus;
      if (totalDist < bestDistance) {
        secondBestDistance = bestDistance;
        bestDistance = totalDist;
        bestItem = item;
      } else if (totalDist < secondBestDistance) {
        secondBestDistance = totalDist;
      }
    }

    const margin = Math.max(0, secondBestDistance - bestDistance);
    const rawConfidence = Math.max(
      28,
      Math.min(
        97,
        Math.round(92 - bestDistance * 95 + margin * 42 + visibility * 10 - lightingPenalty),
      ),
    );

    // Trigger Uncertainty Detection when confidence drops below threshold or excessive blur/velocity
    const isTooFastBlur = velocity > 2.35;
    const isLowLightFail = effectiveLuminance < 48;
    const isUncertain = rawConfidence < confidenceThreshold || isTooFastBlur || isLowLightFail;

    let uncertaintyReasonAr: string | null = null;
    if (isUncertain) {
      if (isLowLightFail) {
        uncertaintyReasonAr =
          'الإضاءة منخفضة جداً — فعّل «تعزيز الإضاءة المنخفضة» أو زد الإضاءة وأعد الإشارة.';
      } else if (isTooFastBlur) {
        uncertaintyReasonAr =
          'حركة اليد سريعة للغاية مما يسبب ضبابية زمنية — يُرجى إعادة الإشارة بإيقاع أوضح.';
      } else {
        uncertaintyReasonAr = `نسبة الثقة (${rawConfidence}%) أقل من حد الأمان (${confidenceThreshold}%) — يُرجى إعادة الإشارة بوضوح بدل تخمين معنى خاطئ.`;
      }
    }

    return {
      handsDetected,
      poseDetected,
      faceDetected,
      luminanceMean,
      motionVelocity: velocity,
      landmarkVisibility: Number(visibility.toFixed(2)),
      confidencePct: rawConfidence,
      isUncertain,
      detectedGloss: !isUncertain && bestItem ? bestItem.glossAr : null,
      uncertaintyReasonAr,
    };
  }
}

export type TTSVoiceOption = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

let activeAudioEl: HTMLAudioElement | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;
let activeSpeechToken = 0;
let activeSafetyTimer: number | null = null;
const ttsAudioCache = new Map<string, ArrayBuffer>();

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function stopAllSpeech(): void {
  activeSpeechToken++;
  if (activeSafetyTimer !== null) {
    window.clearTimeout(activeSafetyTimer);
    activeSafetyTimer = null;
  }
  if (activeBufferSource) {
    try {
      activeBufferSource.onended = null;
      activeBufferSource.stop();
      activeBufferSource.disconnect();
    } catch {
      // ignore
    }
    activeBufferSource = null;
  }
  if (activeAudioEl) {
    try {
      activeAudioEl.onended = null;
      activeAudioEl.onerror = null;
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioEl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

async function speakWithBrowserFallback(
  text: string,
  rate: number,
  token: number,
  onEnd?: () => void,
): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      synth.addEventListener('voiceschanged', finish, { once: true });
      window.setTimeout(finish, 180);
    });
    voices = synth.getVoices();
  }

  if (token !== activeSpeechToken) return false;

  const arabicVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith('ar-eg')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
  const anyFallbackVoice =
    voices.find((v) => v.default) || voices[0] || null;

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (activeSafetyTimer !== null) {
        window.clearTimeout(activeSafetyTimer);
        activeSafetyTimer = null;
      }
      if (token === activeSpeechToken) {
        onEnd?.();
      }
      resolve(ok);
    };

    const runUtterance = (useArabic: boolean, allowRetry: boolean) => {
      if (token !== activeSpeechToken) {
        finish(false);
        return;
      }
      try {
        synth.cancel();
        if (synth.paused) synth.resume();
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (useArabic && arabicVoice) {
        utterance.voice = arabicVoice;
        utterance.lang = arabicVoice.lang;
      } else if (useArabic && voices.length === 0) {
        utterance.lang = 'ar-EG';
      } else if (anyFallbackVoice) {
        utterance.voice = anyFallbackVoice;
        utterance.lang = anyFallbackVoice.lang;
      }

      utterance.rate = Math.min(1.5, Math.max(0.65, rate));
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => finish(true);
      utterance.onerror = () => {
        if (allowRetry) {
          runUtterance(false, false);
        } else {
          finish(false);
        }
      };

      activeSafetyTimer = window.setTimeout(
        () => finish(true),
        Math.max(4500, Math.min(20000, text.length * 160)),
      );

      synth.speak(utterance);
    };

    runUtterance(Boolean(arabicVoice), true);
  });
}

export function speakArabicText(
  text: string,
  rate = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  voiceName: TTSVoiceOption = 'Kore',
): boolean {
  if (typeof window === 'undefined' || !text.trim()) {
    onEnd?.();
    return false;
  }

  const cleanText = text.trim();
  stopAllSpeech();
  const token = activeSpeechToken;

  // Synchronously unlock Web Audio inside the user click gesture
  const audioCtx = getAudioContext();
  onStart?.();

  const playArrayBuffer = async (rawBuffer: ArrayBuffer, mimeType = 'audio/wav') => {
    if (token !== activeSpeechToken) return;

    if (audioCtx) {
      try {
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const decoded = await audioCtx.decodeAudioData(rawBuffer.slice(0));
        if (token !== activeSpeechToken) return;
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.playbackRate.value = Math.min(1.4, Math.max(0.7, rate));
        source.connect(audioCtx.destination);
        activeBufferSource = source;
        source.onended = () => {
          if (activeBufferSource === source) activeBufferSource = null;
          if (token === activeSpeechToken) {
            onEnd?.();
          }
        };
        source.start(0);
        return;
      } catch {
        // Fallback to HTMLAudioElement below
      }
    }

    const blob = new Blob([rawBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = Math.min(1.4, Math.max(0.7, rate));
    activeAudioEl = audio;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (activeAudioEl === audio) activeAudioEl = null;
      if (token === activeSpeechToken) {
        onEnd?.();
      }
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    await audio.play();
  };

  void (async () => {
    const cacheKey = `${voiceName}:${cleanText}`;
    const cached = ttsAudioCache.get(cacheKey);
    if (cached) {
      try {
        await playArrayBuffer(cached);
        return;
      } catch {
        // continue to fallback
      }
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName }),
      });

      if (token !== activeSpeechToken) return;

      if (res.ok) {
        const data = (await res.json()) as {
          audioBase64?: string;
          mimeType?: string;
        };
        if (data.audioBase64) {
          const buffer = base64ToArrayBuffer(data.audioBase64);
          if (ttsAudioCache.size > 60) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, buffer);
          await playArrayBuffer(buffer, data.mimeType || 'audio/wav');
          return;
        }
      }
    } catch {
      // Network/API unavailable: gracefully fall back to browser speech synthesis
    }

    if (token !== activeSpeechToken) return;
    const browserSpoke = await speakWithBrowserFallback(cleanText, rate, token, onEnd);
    if (!browserSpoke && token === activeSpeechToken) {
      onEnd?.();
    }
  })();

  return true;
}
