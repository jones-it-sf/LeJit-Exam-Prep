import type { PracticeMode } from "@/types/exam";

const PREFIX = "exam-progress:v1";

export interface ExamProgressData {
  lastQuestionIndex: number;
  starredIds: string[];
  wrongIds: string[];
  prefs: {
    shuffle: boolean;
    mode: PracticeMode;
    /** domain label or `"all"` */
    domain: string;
  };
}

export function storageKey(slug: string): string {
  return `${PREFIX}:${slug}`;
}

const defaultPrefs = (): ExamProgressData["prefs"] => ({
  shuffle: false,
  mode: "study",
  domain: "all",
});

/** Replaceable later with API-backed implementation */
export interface ProgressBackend {
  load(slug: string): Partial<ExamProgressData> | null;
  save(slug: string, patch: Partial<ExamProgressData>): void;
  reset(slug: string): void;
}

function mergeExamProgress(
  prev: Partial<ExamProgressData>,
  patch: Partial<ExamProgressData>,
): ExamProgressData {
  return {
    lastQuestionIndex: patch.lastQuestionIndex ?? prev.lastQuestionIndex ?? 0,
    starredIds:
      patch.starredIds !== undefined
        ? [...patch.starredIds]
        : [...(prev.starredIds ?? [])],
    wrongIds:
      patch.wrongIds !== undefined
        ? [...patch.wrongIds]
        : [...(prev.wrongIds ?? [])],
    prefs: {
      ...defaultPrefs(),
      ...prev.prefs,
      ...patch.prefs,
    },
  };
}

class LocalProgressBackend implements ProgressBackend {
  load(slug: string): Partial<ExamProgressData> | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Partial<ExamProgressData>;
    } catch {
      return null;
    }
  }

  save(slug: string, patch: Partial<ExamProgressData>): void {
    if (typeof localStorage === "undefined") return;
    const prev = this.load(slug) ?? {};
    const merged = mergeExamProgress(prev, patch);
    localStorage.setItem(storageKey(slug), JSON.stringify(merged));
  }

  reset(slug: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(storageKey(slug));
  }
}

/** Client-only persistence */
export const progressBackend: ProgressBackend = new LocalProgressBackend();

export function loadMergedProgress(slug: string): ExamProgressData {
  const raw = progressBackend.load(slug);
  const prefs = { ...defaultPrefs(), ...raw?.prefs };
  return {
    lastQuestionIndex: raw?.lastQuestionIndex ?? 0,
    starredIds: raw?.starredIds ?? [],
    wrongIds: raw?.wrongIds ?? [],
    prefs,
  };
}
