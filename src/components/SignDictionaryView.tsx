import React, { useMemo, useRef, useState } from 'react';
import { Search, Volume2 } from 'lucide-react';
import { ESL_DICTIONARY } from '../data/eslLexicon';
import type { SignCategory, SignDictionaryItem } from '../types/signbridge';
import { speakArabicText } from '../utils/holisticEngine';
import { KinematicSignCanvas } from './KinematicSignCanvas';

const CATEGORIES: Array<'الكل' | SignCategory> = [
  'الكل',
  'تحيات',
  'تعليم',
  'طوارئ',
  'حياة يومية',
  'ضمائر وأفعال',
];

interface SignDictionaryViewProps {
  onRecordSpoken?: () => void;
  onRecordExploredSign?: (id: string) => void;
}

export const SignDictionaryView: React.FC<SignDictionaryViewProps> = ({
  onRecordSpoken,
  onRecordExploredSign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'الكل' | SignCategory>('الكل');
  const [activeSign, setActiveSign] = useState<SignDictionaryItem>(ESL_DICTIONARY[0]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { الكل: ESL_DICTIONARY.length };
    for (const item of ESL_DICTIONARY) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredSigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ESL_DICTIONARY.filter((item) => {
      if (selectedCategory !== 'الكل' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.arabicWord.toLowerCase().includes(q) ||
        item.glossAr.toLowerCase().includes(q) ||
        item.englishGloss.toLowerCase().includes(q) ||
        item.handShapeAr.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectSign = (item: SignDictionaryItem) => {
    setActiveSign(item);
    onRecordExploredSign?.(item.id);
    if (window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSpeakSign = (item: SignDictionaryItem) => {
    onRecordSpoken?.();
    onRecordExploredSign?.(item.id);
    speakArabicText(
      item.arabicWord,
      1.0,
      () => setSpeakingId(item.id),
      () => setSpeakingId((prev) => (prev === item.id ? null : prev)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            قاموس الإشارات المصرية ({ESL_DICTIONARY.length} كلمة)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            اختر أي كلمة لمشاهدة حركة اليدين والوجه وسماع نطقها بالعربية فوراً.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن كلمة... (مثال: مدرسة، مساعدة)"
            className="w-full rounded-xl border border-cyan-500/30 bg-[#0d1322] pr-9 pl-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Category Filter Bar with counts */}
      <div className="flex items-center gap-1 p-1 bg-[#0d1322] rounded-xl border border-slate-800 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-400 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {cat} ({categoryCounts[cat] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active Sign Preview First on Mobile so selection is immediately visible */}
        <div
          ref={previewRef}
          className="lg:col-span-5 lg:order-2 lg:sticky lg:top-20 bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 space-y-4 neon-glow-cyan"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">
                {activeSign.category} · {activeSign.difficulty}
              </div>
              <h2 className="text-2xl font-bold text-cyan-300 mt-1">
                {activeSign.arabicWord}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => handleSpeakSign(activeSign)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer shrink-0 min-h-[40px]"
            >
              <Volume2 className="w-4 h-4" />
              <span>{speakingId === activeSign.id ? 'ينطق...' : 'اسمع الكلمة'}</span>
            </button>
          </div>

          <KinematicSignCanvas
            pose={activeSign.keyframePose}
            labelAr={activeSign.arabicWord}
            subLabelAr={activeSign.bodyAnchor}
            animate
            heightClass="h-60"
          />

          <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
            <div>
              <span className="font-semibold text-slate-100">شكل اليد: </span>
              <span>{activeSign.handShapeAr}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-100">طريقة الحركة: </span>
              <span>{activeSign.motionTrajectoryAr}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-100">تعبير الوجه: </span>
              <span>{activeSign.facialCueAr}</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="font-semibold text-slate-100">مثال في جملة: </span>
              <span className="text-fuchsia-300 font-medium">«{activeSign.exampleSentenceAr}»</span>
            </div>
          </div>
        </div>

        {/* Dictionary Grid */}
        <div className="lg:col-span-7 lg:order-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredSigns.length === 0 ? (
            <div className="sm:col-span-2 py-12 text-center text-sm text-slate-400 bg-[#0d1322] border border-slate-800 rounded-2xl">
              لا توجد إشارات مطابقة لبحثك — جرّب كلمة أخرى.
            </div>
          ) : (
            filteredSigns.map((item) => {
              const isSelected = activeSign.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-colors flex items-stretch justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/35 neon-glow-cyan'
                      : 'border-slate-800 bg-[#0d1322] hover:border-cyan-500/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSign(item)}
                    className="flex-1 text-right p-4 cursor-pointer"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-50">{item.arabicWord}</h3>
                      <span className="text-[11px] font-mono-tabular text-cyan-300">
                        {item.englishGloss}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.bodyAnchor}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300 line-clamp-1">
                      {item.motionTrajectoryAr}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpeakSign(item)}
                    aria-label={`نطق كلمة ${item.arabicWord}`}
                    className={`px-3 flex items-center justify-center border-r border-slate-800/80 rounded-l-xl cursor-pointer transition-colors ${
                      speakingId === item.id
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/30'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
