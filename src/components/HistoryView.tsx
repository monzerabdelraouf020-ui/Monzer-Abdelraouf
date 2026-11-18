import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ShieldCheck,
  Trash2,
  Volume2,
} from 'lucide-react';
import type { TranslationHistoryItem } from '../types/signbridge';
import { speakArabicText } from '../utils/holisticEngine';

interface HistoryViewProps {
  items: TranslationHistoryItem[];
  consentGranted: boolean;
  onToggleConsent: (next: boolean) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onRecordSpoken?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  items,
  consentGranted,
  onToggleConsent,
  onDeleteItem,
  onClearAll,
  onRecordSpoken,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = [
      'id',
      'created_at',
      'signer_mode',
      'glosses',
      'contextual_sentence_ar',
      'confidence_pct',
      'rejected_as_uncertain',
      'latency_ms',
    ];
    const rows = items.map((item) => [
      item.id,
      item.createdAt,
      item.signerMode,
      `"${item.glosses.join(' ')}"`,
      `"${item.contextualSentenceAr.replace(/"/g, '""')}"`,
      item.confidencePct,
      item.rejectedAsUncertain,
      item.latencyMs,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            سجل الترجمات المحفوظة
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            يمكنك إعادة تشغيل الصوت أو نسخ أي جملة مترجمة أو تصديرها بملف Excel (CSV).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-cyan-500/30 bg-[#0d1322] text-xs font-medium text-cyan-300 hover:border-cyan-400 cursor-pointer disabled:opacity-45"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void onClearAll()}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 text-xs font-medium text-rose-300 hover:bg-rose-950/70 cursor-pointer disabled:opacity-45"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح الكل</span>
          </button>
        </div>
      </div>

      {/* Explicit Consent Governance Panel */}
      <div className="bg-[#0d1322] border border-cyan-500/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-100">
              خصوصيتك محفوظة: لا يُخزن أي فيديو
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              تُحفظ الجمل النصية فقط بموافقتك لتتمكن من الرجوع إليها لاحقاً.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-[#111a2e] text-xs font-semibold text-cyan-200 cursor-pointer shrink-0 min-h-[42px]">
          <input
            type="checkbox"
            checked={consentGranted}
            onChange={(e) => onToggleConsent(e.target.checked)}
            className="rounded border-slate-700 accent-cyan-400"
          />
          <span>{consentGranted ? 'موافقة الحفظ مفعّلة' : 'تفعيل موافقة الحفظ'}</span>
        </label>
      </div>

      {/* History List */}
      {items.length === 0 ? (
        <div className="bg-[#0d1322] border border-slate-800 rounded-2xl py-16 px-6 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-200">
            لا توجد ترجمات محفوظة بعد
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            في شاشة «المترجم المباشر»، اضغط زر «حفظ في السجل» بعد أي ترجمة لتظهر هنا مباشرة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#0d1322] border border-slate-800 hover:border-cyan-500/35 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-fuchsia-300">
                    {item.signerMode === 'live_camera'
                      ? 'كاميرا مباشرة'
                      : item.signerMode === 'reverse_speech'
                      ? 'الوضع العكسي'
                      : 'عرض توضيحي'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {new Date(item.createdAt).toLocaleString('ar-EG')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-cyan-300">
                    ثقة {item.confidencePct}%
                  </span>
                </div>

                <p className="text-lg font-bold text-slate-50">
                  {item.contextualSentenceAr}
                </p>

                {item.glosses.length > 0 && (
                  <div className="text-xs text-slate-400">
                    الإشارات: {item.glosses.join(' ← ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onRecordSpoken?.();
                    speakArabicText(
                      item.contextualSentenceAr,
                      1.0,
                      () => setSpeakingId(item.id),
                      () => setSpeakingId((prev) => (prev === item.id ? null : prev)),
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 cursor-pointer min-h-[40px]"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{speakingId === item.id ? 'ينطق...' : 'اسمع'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy(item.id, item.contextualSentenceAr)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/35 bg-[#111a2e] text-xs font-medium text-cyan-200 hover:border-cyan-400 cursor-pointer min-h-[40px]"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === item.id ? 'نُسخ' : 'نسخ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteItem(item.id)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-slate-800 bg-[#111a2e] text-xs text-rose-300 hover:border-rose-500/40 cursor-pointer min-h-[40px]"
                  aria-label="حذف الترجمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
