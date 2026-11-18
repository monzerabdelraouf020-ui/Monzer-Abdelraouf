import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Camera,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  History,
  Loader2,
} from 'lucide-react';
import type {
  ExperimentTrialRecord,
  ResearchSummary,
  TranslationHistoryItem,
} from './types/signbridge';
import { LiveTranslatorView } from './components/LiveTranslatorView';
import { SignDictionaryView } from './components/SignDictionaryView';
import { LearningModeView } from './components/LearningModeView';
import { HistoryView } from './components/HistoryView';
import { ResearchDashboardView } from './components/ResearchDashboardView';
import { GuideView } from './components/GuideView';
import { ProgressLevelBar } from './components/ProgressLevelBar';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  loadUserProgress,
  saveUserProgress,
  type UserProgressState,
} from './utils/userProgress';

type ActiveScreen =
  | 'translator'
  | 'dictionary'
  | 'learning'
  | 'history'
  | 'research'
  | 'guide';

const NAV_ITEMS: Array<{
  id: ActiveScreen;
  label: string;
  mobileLabel: string;
  icon: typeof Camera;
}> = [
  { id: 'translator', label: 'المترجم المباشر', mobileLabel: 'المترجم', icon: Camera },
  { id: 'dictionary', label: 'قاموس الإشارات', mobileLabel: 'القاموس', icon: BookOpen },
  { id: 'learning', label: 'وضع التدريب', mobileLabel: 'التدريب', icon: GraduationCap },
  { id: 'history', label: 'سجل الترجمات', mobileLabel: 'السجل', icon: History },
  { id: 'research', label: 'لوحة البحث', mobileLabel: 'البحث', icon: FlaskConical },
  { id: 'guide', label: 'دليل الموقع', mobileLabel: 'الدليل', icon: HelpCircle },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('translator');
  const [summary, setSummary] = useState<ResearchSummary | null>(null);
  const [trials, setTrials] = useState<ExperimentTrialRecord[]>([]);
  const [historyItems, setHistoryItems] = useState<TranslationHistoryItem[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressState>(() =>
    loadUserProgress(),
  );
  const [consentGranted, setConsentGranted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('signbridge_consent') === 'true';
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { isInstallable, isIOS, isInstalled } = usePWAInstall();

  const updateProgress = useCallback(
    (updater: (prev: UserProgressState) => UserProgressState) => {
      setUserProgress((prev) => {
        const next = updater(prev);
        saveUserProgress(next);
        return next;
      });
    },
    [],
  );

  const recordSpoken = useCallback(() => {
    updateProgress((prev) => ({ ...prev, spokenCount: prev.spokenCount + 1 }));
  }, [updateProgress]);

  const recordTranslated = useCallback(() => {
    updateProgress((prev) => ({
      ...prev,
      translatedCount: prev.translatedCount + 1,
    }));
  }, [updateProgress]);

  const recordExploredSign = useCallback(
    (signId: string) => {
      updateProgress((prev) =>
        prev.exploredSignIds.includes(signId)
          ? prev
          : { ...prev, exploredSignIds: [...prev.exploredSignIds, signId] },
      );
    },
    [updateProgress],
  );

  const recordMasteredSign = useCallback(
    (signId: string) => {
      updateProgress((prev) =>
        prev.masteredSignIds.includes(signId)
          ? prev
          : { ...prev, masteredSignIds: [...prev.masteredSignIds, signId] },
      );
    },
    [updateProgress],
  );

  const recordGuideSectionRead = useCallback(
    (sectionId: string) => {
      updateProgress((prev) =>
        prev.guideReadSections.includes(sectionId)
          ? prev
          : {
              ...prev,
              guideReadSections: [...prev.guideReadSections, sectionId],
            },
      );
    },
    [updateProgress],
  );

  const handleToggleConsent = (next: boolean) => {
    setConsentGranted(next);
    try {
      localStorage.setItem('signbridge_consent', String(next));
    } catch {
      // ignore storage errors
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [researchRes, historyRes] = await Promise.all([
        fetch('/api/research'),
        fetch('/api/history'),
      ]);

      if (!researchRes.ok || !historyRes.ok) {
        throw new Error('تعذر تحميل بيانات البحث والسجل من الخادم');
      }

      const researchData = (await researchRes.json()) as {
        summary: ResearchSummary;
        trials: ExperimentTrialRecord[];
      };
      const historyData = (await historyRes.json()) as {
        items: TranslationHistoryItem[];
      };

      setSummary(researchData.summary);
      setTrials(researchData.trials);
      setHistoryItems(historyData.items);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  const handleSaveToHistory = async (
    item: Omit<TranslationHistoryItem, 'id' | 'createdAt'>,
  ) => {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = (await res.json()) as { items?: TranslationHistoryItem[]; error?: string };
    if (!res.ok || !data.items) {
      throw new Error(data.error || 'تعذر حفظ الترجمة');
    }
    setHistoryItems(data.items);
    updateProgress((prev) => ({ ...prev, savedCount: prev.savedCount + 1 }));
  };

  const handleDeleteHistoryItem = async (id: string) => {
    const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = (await res.json()) as { items?: TranslationHistoryItem[]; error?: string };
    if (!res.ok || !data.items) {
      throw new Error(data.error || 'تعذر حذف السجل');
    }
    setHistoryItems(data.items);
  };

  const handleClearHistory = async () => {
    const res = await fetch('/api/history', { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('تعذر مسح السجل');
    }
    setHistoryItems([]);
  };

  const handleLogResearchTrial = async (trial: Partial<ExperimentTrialRecord>) => {
    const res = await fetch('/api/research/trials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trial),
    });
    const data = (await res.json()) as {
      trials?: ExperimentTrialRecord[];
      summary?: ResearchSummary;
      error?: string;
    };
    if (!res.ok || !data.trials || !data.summary) {
      throw new Error(data.error || 'تعذر تسجيل التجربة');
    }
    setTrials(data.trials);
    setSummary(data.summary);
    updateProgress((prev) => ({
      ...prev,
      trialsLoggedCount: prev.trialsLoggedCount + 1,
    }));
  };

  const handleResetTrials = async () => {
    const res = await fetch('/api/research/reset', { method: 'POST' });
    const data = (await res.json()) as {
      trials?: ExperimentTrialRecord[];
      summary?: ResearchSummary;
    };
    if (!res.ok || !data.trials || !data.summary) {
      throw new Error('تعذر استعادة التجارب المرجعية');
    }
    setTrials(data.trials);
    setSummary(data.summary);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090f] text-slate-100 pb-16 md:pb-0">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#090d18]/90 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveScreen('translator')}
            className="text-lg font-bold tracking-tight text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            SignBridge AI
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScreen(item.id)}
                className={`py-1.5 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                  activeScreen === item.id
                    ? 'border-cyan-400 text-cyan-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            {!isInstalled && (isInstallable || isIOS) ? (
              <PWAInstallButton compact />
            ) : (
              <button
                type="button"
                onClick={() =>
                  setActiveScreen(activeScreen === 'research' ? 'translator' : 'research')
                }
                className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer neon-glow-cyan"
              >
                {activeScreen === 'research' ? 'المترجم المباشر' : 'نتائج تجارب ISEF'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Persistent User Progress Level Bar */}
      <ProgressLevelBar
        progress={userProgress}
        onGoToLearning={() => setActiveScreen('learning')}
        onGoToGuide={() => setActiveScreen('guide')}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>جاري تهيئة قاموس الإشارات وبيانات التجارب...</span>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-6 text-center space-y-3">
            <p className="text-sm font-medium text-rose-200">{errorMsg}</p>
            <button
              type="button"
              onClick={() => void fetchAllData()}
              className="px-4 py-2 rounded-lg bg-rose-500 text-slate-950 text-xs font-semibold hover:bg-rose-400 cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {activeScreen === 'translator' && (
              <LiveTranslatorView
                consentGranted={consentGranted}
                onToggleConsent={handleToggleConsent}
                onSaveToHistory={handleSaveToHistory}
                onLogResearchTrial={handleLogResearchTrial}
                onRecordSpoken={recordSpoken}
                onRecordTranslated={recordTranslated}
              />
            )}

            {activeScreen === 'dictionary' && (
              <SignDictionaryView
                onRecordSpoken={recordSpoken}
                onRecordExploredSign={recordExploredSign}
              />
            )}

            {activeScreen === 'learning' && (
              <LearningModeView
                masteredIds={userProgress.masteredSignIds}
                onMasterSign={recordMasteredSign}
                onRecordSpoken={recordSpoken}
              />
            )}

            {activeScreen === 'history' && (
              <HistoryView
                items={historyItems}
                consentGranted={consentGranted}
                onToggleConsent={handleToggleConsent}
                onDeleteItem={handleDeleteHistoryItem}
                onClearAll={handleClearHistory}
                onRecordSpoken={recordSpoken}
              />
            )}

            {activeScreen === 'research' && summary && (
              <ResearchDashboardView
                summary={summary}
                trials={trials}
                onResetTrials={handleResetTrials}
                onStartTranslator={() => setActiveScreen('translator')}
              />
            )}

            {activeScreen === 'guide' && (
              <GuideView
                readSectionIds={userProgress.guideReadSections}
                onMarkSectionRead={recordGuideSectionRead}
                onNavigate={(screen) => setActiveScreen(screen)}
              />
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="hidden md:block border-t border-cyan-500/15 bg-[#090d18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 text-xs text-slate-400">
          <span>SignBridge AI — ترجمة لغة الإشارة المصرية إلى نص وصوت عربي مسموع</span>
          <div className="flex items-center gap-4">
            <PWAInstallButton />
            <span>تطبيق ويب تقدمي (PWA) · قاعدة بيانات SQLite</span>
          </div>
        </div>
      </footer>

      {/* Mobile PWA Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label="التنقل السفلي"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d18]/95 backdrop-blur-md border-t border-cyan-500/20 grid grid-cols-6 h-16"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[10px] font-medium transition-colors cursor-pointer ${
                active ? 'text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>

      <OfflineIndicator />
    </div>
  );
}
