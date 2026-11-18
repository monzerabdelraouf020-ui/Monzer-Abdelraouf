export interface UserProgressState {
  masteredSignIds: string[];
  exploredSignIds: string[];
  spokenCount: number;
  translatedCount: number;
  savedCount: number;
  trialsLoggedCount: number;
  guideReadSections: string[];
}

export interface ComputedProgressLevel {
  xp: number;
  level: number;
  titleAr: string;
  currentLevelMinXp: number;
  nextLevelXp: number | null;
  levelPct: number;
  xpToNext: number;
}

const PROGRESS_STORAGE_KEY = 'signbridge_user_progress_v1';
const MASTERED_LEGACY_KEY = 'signbridge_mastered_ids';

const LEVEL_TIERS = [
  { level: 1, minXp: 0, titleAr: 'مبتدئ في الإشارة' },
  { level: 2, minXp: 100, titleAr: 'متواصل نشط' },
  { level: 3, minXp: 250, titleAr: 'ممارس متقدم' },
  { level: 4, minXp: 500, titleAr: 'سفير لغة الإشارة' },
  { level: 5, minXp: 900, titleAr: 'خبير SignBridge' },
];

export function loadUserProgress(): UserProgressState {
  let legacyMastered: string[] = [];
  try {
    const rawLegacy = localStorage.getItem(MASTERED_LEGACY_KEY);
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy);
      if (Array.isArray(parsed)) legacyMastered = parsed.filter((x) => typeof x === 'string');
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProgressState>;
      const mergedMastered = Array.from(
        new Set([
          ...legacyMastered,
          ...(Array.isArray(parsed.masteredSignIds) ? parsed.masteredSignIds : []),
        ]),
      );
      return {
        masteredSignIds: mergedMastered,
        exploredSignIds: Array.isArray(parsed.exploredSignIds) ? parsed.exploredSignIds : [],
        spokenCount: Number(parsed.spokenCount || 0),
        translatedCount: Number(parsed.translatedCount || 0),
        savedCount: Number(parsed.savedCount || 0),
        trialsLoggedCount: Number(parsed.trialsLoggedCount || 0),
        guideReadSections: Array.isArray(parsed.guideReadSections) ? parsed.guideReadSections : [],
      };
    }
  } catch {
    // ignore
  }

  return {
    masteredSignIds: legacyMastered,
    exploredSignIds: [],
    spokenCount: 0,
    translatedCount: 0,
    savedCount: 0,
    trialsLoggedCount: 0,
    guideReadSections: [],
  };
}

export function saveUserProgress(state: UserProgressState): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(MASTERED_LEGACY_KEY, JSON.stringify(state.masteredSignIds));
  } catch {
    // ignore storage quota errors
  }
}

export function computeProgressLevel(state: UserProgressState): ComputedProgressLevel {
  const xp =
    state.masteredSignIds.length * 40 +
    state.exploredSignIds.length * 10 +
    state.spokenCount * 10 +
    state.translatedCount * 15 +
    state.savedCount * 20 +
    state.trialsLoggedCount * 25 +
    state.guideReadSections.length * 10;

  let currentIdx = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      currentIdx = i;
    }
  }

  const current = LEVEL_TIERS[currentIdx];
  const next = LEVEL_TIERS[currentIdx + 1] ?? null;

  if (!next) {
    return {
      xp,
      level: current.level,
      titleAr: current.titleAr,
      currentLevelMinXp: current.minXp,
      nextLevelXp: null,
      levelPct: 100,
      xpToNext: 0,
    };
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const progressInSpan = Math.max(0, xp - current.minXp);
  const levelPct = Math.min(100, Math.round((progressInSpan / span) * 100));

  return {
    xp,
    level: current.level,
    titleAr: current.titleAr,
    currentLevelMinXp: current.minXp,
    nextLevelXp: next.minXp,
    levelPct,
    xpToNext: Math.max(0, next.minXp - xp),
  };
}
