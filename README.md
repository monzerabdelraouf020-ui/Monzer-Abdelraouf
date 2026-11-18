# SignBridge AI

**Context-Aware Egyptian Sign Language Translation & Assistive Communication Platform**  
**من لغة الإشارة المصرية إلى النص والصوت العربي — ومن الكلام إلى إشارات مرئية**

SignBridge AI is a bilingual-documented, Arabic-first RTL web application and installable Progressive Web App (PWA) designed to bridge communication between Deaf/Hard-of-Hearing individuals using Egyptian Sign Language (ESL) and hearing speakers, paired with an ISEF-ready scientific evaluation suite.

---

## Key Features | أبرز المزايا

1. **Two-Way Live Translator (`المترجم المباشر`)**
   - **Sign → Arabic Text & Voice:** Real-time browser tracking via **MediaPipe** (hands, upper-body pose, and facial expression landmarks) with temporal sequence smoothing, interactive kinematic simulator scenarios, and instant Arabic voice output (server-side Gemini TTS WAV generation with automatic browser `speechSynthesis` fallback).
   - **Speech / Text → Visual ESL Signs (`كلام ← إشارة مرئية`):** Translates any spoken or typed Arabic sentence (both Egyptian dialect and Modern Standard Arabic) into animated sign sequences, including dialect synonym mapping, AI ESL grammar structuring, and automatic Arabic fingerspelling for names and specialized terms.
2. **Egyptian Sign Language Dictionary (`قاموس الإشارات`)**
   - 52 categorized ESL signs (`تحيات`, `تعليم`, `طوارئ`, `حياة يومية`, `ضمائر وأفعال`) with instant search, 2D kinematic hand/body animations, hand-shape/trajectory/facial cues, and one-tap Arabic audio pronunciation.
3. **Interactive Learning Mode & XP Progress System (`وضع التدريب ومستوى التقدم`)**
   - Step-by-step lessons, quick comprehension quizzes, optional live camera matching, and a persistent 5-level XP progression bar across the entire app.
4. **Consent-Gated Translation History (`سجل الترجمات`)**
   - Explicit user consent governance: **no raw camera video or images are ever stored**—only text translations and telemetry saved to local **SQLite**, with audio replay, copy, and CSV export.
5. **ISEF Research Dashboard (`لوحة البحث العلمي`)**
   - Evaluates 4 core experiments across **Accuracy**, **Precision**, **Recall**, **Macro-F1**, **Word Error Rate (WER)**, **Latency (ms)**, and **Uncertainty Rejection Rate**, enforcing strict **Signer-Independent Splits** (`S01–S08` train vs. `S09–S12` unseen signers).
6. **Comprehensive In-App Guide (`دليل الموقع`)**
   - Searchable Arabic guide explaining every button, screen, progress level, privacy control, and scientific metric.

---

## Scientific Research Focus (ISEF) | المحور البحثي

> **Research Question:** Does combining temporal hand-and-body motion landmarks with uncertainty estimation improve the real-time translation accuracy of Egyptian Sign Language into Arabic sentences—especially when tested on unseen signers?

Core tested pillars:
- **Signer Independence (`الاستقلال عن الشخص`):** Participant-based train/test splitting to prevent signer overfitting.
- **Motion Understanding (`فهم الحركة المتتابعة`):** Temporal landmark trajectories rather than static single-frame poses.
- **Context-Aware Translation (`الترجمة السياقية`):** Converting gloss sequences (e.g. `أنا + أريد + ذهاب + مدرسة`) into natural Arabic sentences (`أنا أريد الذهاب إلى المدرسة.`).
- **Uncertainty Detection (`كشف عدم اليقين`):** Rejecting low-confidence or motion-blurred gestures and asking to repeat rather than hallucinating wrong translations.
- **Low-Light Robustness (`مقاومة الإضاءة المنخفضة`):** Adaptive brightness/contrast enhancement and real-time luminance (`Lux`) estimation.

---

## Tech Stack | التقنيات المستخدمة

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, `vite-plugin-pwa`
- **Computer Vision:** `@mediapipe/tasks-vision` (Hand, Pose & Face Landmarkers)
- **Backend:** Node.js, Express, built-in `node:sqlite` (`DatabaseSync`)
- **AI & Speech Services:** `@google/genai` (server-side contextual refinement, speech-to-sign structuring, and Arabic WAV TTS via `gemini-3.8-flash-lite-tts` + browser Web Speech fallback)

---

## Running Locally | التشغيل المحلي

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env` and set your `GEMINI_API_KEY` (optional for local mode; enables server-side contextual refinement, AI ESL grammar ordering, and neural Arabic TTS):
   ```bash
   cp .env.example .env
   ```
3. **Start the development server (port 3000):**
   ```bash
   npm run dev
   ```
4. **Type-check & build for production:**
   ```bash
   npm run lint
   npm run build
   npm start
   ```

---

## Dataset Acknowledgments | مصادر البيانات

- **Egyptian Sign Language Dataset** (CC BY 4.0)
- **ArabSign** Continuous Arabic Sign Language Dataset
