import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { computeProgressLevel, type UserProgressState } from '../utils/userProgress';

interface ProgressLevelBarProps {
  progress: UserProgressState;
  onGoToLearning: () => void;
  onGoToGuide: () => void;
}

export const ProgressLevelBar: React.FC<ProgressLevelBarProps> = ({
  progress,
  onGoToLearning,
  onGoToGuide,
}) => {
  const [expanded, setExpanded] = useState(false);
  const info = computeProgressLevel(progress);

  return (
    <section
      aria-label="مستوى التقدم"
      className="bg-[#0a101f] border-b border-cyan-500/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Level Label + Progress Bar */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 min-w-[240px] flex items-center gap-3 text-right cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-cyan-300" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">
                    المستوى {info.level}
                  </span>
                  <span className="text-slate-200 font-medium">
                    · {info.titleAr}
                  </span>
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-300">
                  <span className="text-cyan-300 font-semibold">{info.xp} XP</span>
                  {info.nextLevelXp !== null ? (
                    <span className="text-slate-400">
                      {' '}
                      / {info.nextLevelXp} ({info.levelPct}%)
                    </span>
                  ) : (
                    <span className="text-fuchsia-300"> · أقصى مستوى</span>
                  )}
                </div>
              </div>

              <div className="h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-cyan-400 to-fuchsia-400 transition-all duration-300"
                  style={{ width: `${Math.max(4, info.levelPct)}%` }}
                />
              </div>
            </div>

            <span className="text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {/* Quick Jump Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onGoToGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-fuchsia-500/35 bg-fuchsia-950/25 text-[11px] font-semibold text-fuchsia-200 hover:border-fuchsia-400 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>دليل الموقع الكامل</span>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="rounded-xl bg-[#0d1322] border border-slate-800 px-3 py-2">
              <div className="text-[11px] text-slate-400">إشارات متقنة</div>
              <div className="font-mono-tabular font-bold text-cyan-300 mt-0.5">
                {progress.masteredSignIds.length} / 8
              </div>
            </div>
            <div className="rounded-xl bg-[#0d1322] border border-slate-800 px-3 py-2">
              <div className="text-[11px] text-slate-400">جمل منطوقة بالصوت</div>
              <div className="font-mono-tabular font-bold text-slate-100 mt-0.5">
                {progress.spokenCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#0d1322] border border-slate-800 px-3 py-2">
              <div className="text-[11px] text-slate-400">ترجمات منفّذة</div>
              <div className="font-mono-tabular font-bold text-slate-100 mt-0.5">
                {progress.translatedCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#0d1322] border border-slate-800 px-3 py-2">
              <div className="text-[11px] text-slate-400">كلمات القاموس</div>
              <div className="font-mono-tabular font-bold text-fuchsia-300 mt-0.5">
                {progress.exploredSignIds.length} / 52
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-[#0d1322] border border-cyan-500/25 px-3 py-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onGoToLearning}
                className="w-full flex items-center justify-center gap-1.5 text-cyan-300 font-semibold hover:text-cyan-200 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>اكسب نقاطاً بالتدريب</span>
              </button>
            </div>

            {info.nextLevelXp !== null && (
              <div className="col-span-2 sm:col-span-5 flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  يتبقى لك{' '}
                  <strong className="text-cyan-300 font-mono-tabular">{info.xpToNext} XP</strong>{' '}
                  للوصول إلى المستوى {info.level + 1} — كل نطق صوتي (+10)، ترجمة (+15)، استكشاف كلمة (+10)، أو إتقان درس (+40) يرفع مستواك.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
