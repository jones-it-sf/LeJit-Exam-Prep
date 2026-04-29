import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Flag,
  Play,
  Trophy,
  XCircle,
} from "@phosphor-icons/react/ssr";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import Select from "@/components/Select";
import { fetchCatalog, fetchQuestionPack } from "@/lib/content";
import { loadMergedProgress, progressBackend } from "@/lib/progress";
import type { PracticeMode, Question } from "@/types/exam";

function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SESSION_SIZES = [25, 50, 75, 100] as const;

type SessionState = "setup" | "active" | "complete";

function correctAnswerIndices(q: Question): number[] {
  return q.correctIndices && q.correctIndices.length > 0
    ? [...q.correctIndices].sort((a, b) => a - b)
    : [q.correctIndex];
}

function isAnswerCorrect(q: Question, given: number[] | undefined): boolean {
  if (!given) return false;
  const correct = correctAnswerIndices(q);
  if (given.length !== correct.length) return false;
  const sorted = [...given].sort((a, b) => a - b);
  return sorted.every((v, i) => v === correct[i]);
}

function isMultiAnswer(q: Question): boolean {
  return Boolean(q.correctIndices && q.correctIndices.length > 1);
}

export default function ExamPracticePage() {
  const { slug = "" } = useParams();

  const [pack, setPack] = useState<Awaited<
    ReturnType<typeof fetchQuestionPack>
  > | null>(null);
  const [title, setTitle] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Session config
  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [sessionSize, setSessionSize] = useState<number>(50);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [sessionMode, setSessionMode] = useState<PracticeMode>("study");
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);

  // Practice state
  const initial = loadMergedProgress(slug);
  const [index, setIndex] = useState(0);
  const [starred, setStarred] = useState<string[]>(initial.starredIds);
  const [wrong, setWrong] = useState<string[]>(initial.wrongIds);
  const [answers, setAnswers] = useState<Record<string, number[] | undefined>>({});
  const [pendingMulti, setPendingMulti] = useState<number[]>([]);
  const [endSessionOpen, setEndSessionOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  useEffect(() => {
    const merged = loadMergedProgress(slug);
    setStarred([...merged.starredIds]);
    setWrong([...merged.wrongIds]);
  }, [slug]);

  useEffect(() => {
    setLoadError(null);
    fetchQuestionPack(slug)
      .then((data) => setPack(data))
      .catch(() => setLoadError("Could not load questions for this exam."));
    fetchCatalog()
      .then((cat) => {
        const entry = cat.exams.find((e) => e.slug === slug);
        setTitle(entry?.title ?? slug);
      })
      .catch(() => setTitle(slug));
  }, [slug]);

  const domains = useMemo(() => {
    if (!pack) return [];
    const set = new Set<string>();
    for (const q of pack.questions) set.add(q.domain);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pack]);

  const availableQuestions = useMemo(() => {
    if (!pack) return [];
    if (selectedDomain === "all") return pack.questions;
    return pack.questions.filter((q) => q.domain === selectedDomain);
  }, [pack, selectedDomain]);

  function startSession() {
    const pool = [...availableQuestions];
    const shuffled = shuffleArray(pool);
    const selected = shuffled.slice(0, Math.min(sessionSize, shuffled.length));
    setSessionQuestions(selected);
    setIndex(0);
    setAnswers({});
    setPendingMulti([]);
    setReviewIndex(null);
    setSessionState("active");
  }

  function endSession() {
    setEndSessionOpen(false);
    setSessionState("setup");
    setSessionQuestions([]);
    setIndex(0);
    setAnswers({});
    setPendingMulti([]);
    setReviewIndex(null);
  }

  function completeSession() {
    setWrong((prev) => {
      const ids = new Set(prev);
      for (const q of sessionQuestions) {
        if (isAnswerCorrect(q, answers[q.id])) ids.delete(q.id);
        else ids.add(q.id);
      }
      return [...ids];
    });
    setSessionState("complete");
  }

  const current: Question | undefined = sessionQuestions[index];
  const reviewQuestion =
    reviewIndex !== null ? sessionQuestions[reviewIndex] : undefined;

  useEffect(() => {
    setPendingMulti([]);
  }, [index]);

  useEffect(() => {
    progressBackend.save(slug, {
      starredIds: starred,
      wrongIds: wrong,
    });
  }, [slug, starred, wrong]);

  function toggleStar(id: string) {
    setStarred((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function applyChoice(choice: number) {
    if (!current) return;
    if (answers[current.id] !== undefined) return;
    if (isMultiAnswer(current)) {
      const required = correctAnswerIndices(current).length;
      setPendingMulti((prev) => {
        const has = prev.includes(choice);
        if (has) return prev.filter((c) => c !== choice);
        if (prev.length >= required) return prev;
        return [...prev, choice];
      });
      return;
    }
    const next = [choice];
    setAnswers((prev) => ({ ...prev, [current.id]: next }));
    if (sessionMode === "study") {
      const correct = isAnswerCorrect(current, next);
      setWrong((prev) => {
        if (correct) return prev.filter((x) => x !== current.id);
        if (prev.includes(current.id)) return prev;
        return [...prev, current.id];
      });
    }
  }

  function submitPendingMulti() {
    if (!current || !isMultiAnswer(current)) return;
    if (answers[current.id] !== undefined) return;
    const required = correctAnswerIndices(current).length;
    if (pendingMulti.length !== required) return;
    const submitted = [...pendingMulti];
    setAnswers((prev) => ({ ...prev, [current.id]: submitted }));
    if (sessionMode === "study") {
      const correct = isAnswerCorrect(current, submitted);
      setWrong((prev) => {
        if (correct) return prev.filter((x) => x !== current.id);
        if (prev.includes(current.id)) return prev;
        return [...prev, current.id];
      });
    }
  }

  function score() {
    if (!sessionQuestions.length) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    for (const q of sessionQuestions) {
      if (isAnswerCorrect(q, answers[q.id])) correct++;
    }
    return {
      correct,
      total: sessionQuestions.length,
      percent: Math.round((correct / sessionQuestions.length) * 100),
    };
  }

  const answeredCurrent = current ? answers[current.id] : undefined;
  const showFeedback = sessionMode === "study" && answeredCurrent !== undefined;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === sessionQuestions.length;
  const isLastQuestion = index === sessionQuestions.length - 1;
  const currentIsMulti = current ? isMultiAnswer(current) : false;
  const currentRequired = current ? correctAnswerIndices(current).length : 1;
  const isCurrentDisputed = Boolean(
    current?.explanation?.includes("Disputed answer"),
  );

  // ===== SETUP SCREEN =====
  if (sessionState === "setup") {
    return (
      <div>
        <div className="border-b border-[var(--border)] px-6 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
            New session
          </p>
          <h1 className="mt-0.5 text-[14px] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
            {title || slug}
          </h1>
        </div>

        {loadError ? (
          <div className="p-6">
            <p className="text-[13px] text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        ) : !pack ? (
          <div className="p-6">
            <p className="text-[13px] text-stone-500">Loading questions…</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mx-auto max-w-xl space-y-7">
              {/* Question count */}
              <div>
                <label className="mb-2.5 block text-[13px] font-medium text-stone-900 dark:text-stone-100">
                  Number of questions
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SESSION_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSessionSize(size)}
                      disabled={availableQuestions.length === 0}
                      className={`h-10 rounded-[6px] border text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        sessionSize === size
                          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-900"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-stone-500">
                  {availableQuestions.length.toLocaleString()} questions in pool
                  {selectedDomain !== "all" ? ` for this domain` : ""}
                </p>
              </div>

              {/* Domain filter */}
              {domains.length > 1 && (
                <div>
                  <label className="mb-2.5 block text-[13px] font-medium text-stone-900 dark:text-stone-100">
                    Domain
                  </label>
                  <Select
                    value={selectedDomain}
                    onChange={setSelectedDomain}
                    options={[
                      {
                        value: "all",
                        label: `All domains (${pack.questions.length.toLocaleString()})`,
                      },
                      ...domains.map((d) => ({
                        value: d,
                        label: `${d} (${pack.questions.filter((q) => q.domain === d).length})`,
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Mode */}
              <div>
                <label className="mb-2.5 block text-[13px] font-medium text-stone-900 dark:text-stone-100">
                  Mode
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ModeCard
                    selected={sessionMode === "study"}
                    onClick={() => setSessionMode("study")}
                    title="Study mode"
                    description="See the correct answer and explanation immediately after each question"
                  />
                  <ModeCard
                    selected={sessionMode === "exam"}
                    onClick={() => setSessionMode("exam")}
                    title="Exam mode"
                    description="Answer all questions first, then review your score and explanations"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={startSession}
                disabled={availableQuestions.length === 0}
                className="btn-primary h-11 w-full"
              >
                <Play className="size-4" weight="fill" />
                Start {sessionMode === "exam" ? "exam" : "practice"} ·{" "}
                {Math.min(sessionSize, availableQuestions.length)} questions
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== COMPLETION SCREEN =====
  if (sessionState === "complete") {
    const s = score();
    const passed = s.percent >= 70;

    if (reviewQuestion !== null && reviewQuestion !== undefined) {
      const userAnswer = answers[reviewQuestion.id];
      const isCorrect = isAnswerCorrect(reviewQuestion, userAnswer);
      const correctSet = new Set(correctAnswerIndices(reviewQuestion));
      const userSet = new Set(userAnswer ?? []);
      const reviewIsDisputed = Boolean(
        reviewQuestion.explanation?.includes("Disputed answer"),
      );

      return (
        <div>
          <div className="sticky top-12 z-10 border-b border-[var(--border)] bg-[var(--bg-content)]/95 px-6 py-3 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReviewIndex(null)}
                className="btn-ghost h-8"
              >
                <ArrowLeft className="size-4" weight="bold" />
                Back to results
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reviewIndex === 0}
                  onClick={() =>
                    setReviewIndex((i) => (i !== null ? Math.max(0, i - 1) : 0))
                  }
                  className="btn-secondary h-8 px-2"
                >
                  <ArrowLeft className="size-3.5" weight="bold" />
                </button>
                <span className="text-[12px] text-stone-500">
                  {(reviewIndex ?? 0) + 1} / {sessionQuestions.length}
                </span>
                <button
                  type="button"
                  disabled={reviewIndex === sessionQuestions.length - 1}
                  onClick={() =>
                    setReviewIndex((i) =>
                      i !== null ? Math.min(sessionQuestions.length - 1, i + 1) : 0,
                    )
                  }
                  className="btn-secondary h-8 px-2"
                >
                  <ArrowRight className="size-3.5" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle className="size-3" weight="fill" />
                  ) : (
                    <XCircle className="size-3" weight="fill" />
                  )}
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
                <span className="text-[12px] text-stone-500">
                  {reviewQuestion.domain}
                </span>
              </div>

              <h2 className="mb-6 text-[15px] leading-relaxed text-stone-950 dark:text-stone-50">
                {reviewQuestion.stem}
              </h2>

              {isMultiAnswer(reviewQuestion) && (
                <p className="mb-3 text-[12px] text-stone-500">
                  Multi-select question · {correctSet.size} correct answers
                </p>
              )}
              {reviewIsDisputed && (
                <div className="mb-4 rounded-[6px] border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Heads up — the published answer is disputed by the community.
                  See the note in the explanation below.
                </div>
              )}

              <div className="space-y-2">
                {reviewQuestion.choices.map((choice, idx) => {
                  const isUserChoice = userSet.has(idx);
                  const isCorrectChoice = correctSet.has(idx);
                  let style =
                    "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900";

                  if (isCorrectChoice) {
                    style =
                      "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
                  } else if (isUserChoice && !isCorrectChoice) {
                    style =
                      "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40";
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex w-full items-start gap-3 rounded-[6px] border px-4 py-3 text-[13px] ${style}`}
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[11px] font-semibold text-stone-600 dark:border-stone-600 dark:text-stone-400">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-stone-800 dark:text-stone-200">
                        {choice}
                      </span>
                      {isCorrectChoice && (
                        <CheckCircle
                          className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          weight="fill"
                        />
                      )}
                      {isUserChoice && !isCorrectChoice && (
                        <XCircle
                          className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
                          weight="fill"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {reviewQuestion.explanation && (
                <div className="mt-6 rounded-[6px] border border-[var(--border)] bg-stone-50 p-4 dark:bg-stone-900">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
                    Explanation
                  </p>
                  <p className="text-[13px] leading-relaxed text-stone-700 dark:text-stone-300">
                    {reviewQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="border-b border-[var(--border)] px-6 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
            Session complete
          </p>
          <h1 className="mt-0.5 text-[14px] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
            {title || slug}
          </h1>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-2xl">
            {/* Score card */}
            <div className="mb-6 rounded-[6px] border border-[var(--border)] bg-stone-50 p-6 text-center dark:bg-stone-900">
              <div
                className={`mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full ${
                  passed
                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                    : "bg-amber-100 dark:bg-amber-900/50"
                }`}
              >
                <Trophy
                  className={`size-5 ${
                    passed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                  weight="fill"
                />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
                Your score
              </p>
              <p className="mt-1 text-[32px] font-bold tracking-tight text-stone-950 tabular-nums dark:text-stone-50">
                {s.percent}%
              </p>
              <p className="mt-0.5 text-[13px] text-stone-500">
                {s.correct} of {s.total} correct
              </p>
            </div>

            {/* Stats grid */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <StatCard
                label="Correct"
                value={s.correct}
                tone="emerald"
              />
              <StatCard
                label="Incorrect"
                value={s.total - s.correct}
                tone="red"
              />
              <StatCard
                label="Mode"
                value={sessionMode === "exam" ? "Exam" : "Study"}
                tone="neutral"
              />
            </div>

            {/* Action buttons */}
            <div className="mb-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  startSession();
                }}
                className="btn-primary h-11"
              >
                <Play className="size-4" weight="fill" />
                New session
              </button>
              <button
                type="button"
                onClick={endSession}
                className="btn-secondary h-11"
              >
                Back to setup
              </button>
            </div>

            {/* Review list */}
            <div>
              <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
                Review questions
              </p>
              <div className="overflow-hidden rounded-[6px] border border-[var(--border)]">
                {sessionQuestions.map((q, i) => {
                  const isCorrect = isAnswerCorrect(q, answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setReviewIndex(i)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-stone-50 dark:hover:bg-stone-900 ${
                        i < sessionQuestions.length - 1
                          ? "border-b border-[var(--border)]"
                          : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 text-[12px] tabular-nums text-stone-500">
                        {i + 1}
                      </span>
                      {isCorrect ? (
                        <CheckCircle
                          className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                          weight="fill"
                        />
                      ) : (
                        <XCircle
                          className="size-4 shrink-0 text-red-600 dark:text-red-400"
                          weight="fill"
                        />
                      )}
                      <span className="flex-1 truncate text-stone-700 dark:text-stone-300">
                        {q.stem}
                      </span>
                      <ArrowRight
                        className="size-3.5 shrink-0 text-stone-400"
                        weight="bold"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ACTIVE SESSION =====
  return (
    <div>
      {/* Sub-header with progress */}
      <div className="border-b border-[var(--border)] px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (answeredCount > 0) {
                  setEndSessionOpen(true);
                } else {
                  endSession();
                }
              }}
              className="btn-secondary h-8 px-2"
              aria-label="End session"
            >
              <ArrowLeft className="size-3.5" weight="bold" />
            </button>
            <div className="text-[13px]">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                Question {index + 1}
              </span>
              <span className="text-stone-500"> / {sessionQuestions.length}</span>
            </div>
            <span className="hidden text-[12px] text-stone-500 sm:inline">
              · {sessionMode === "exam" ? "Exam" : "Study"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {sessionMode === "exam" && (
              <span className="text-[12px] text-stone-500">
                {answeredCount} answered
              </span>
            )}
            <button
              type="button"
              onClick={() => current && toggleStar(current.id)}
              aria-label={
                current && starred.includes(current.id) ? "Unflag" : "Flag"
              }
              className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] transition-colors ${
                current && starred.includes(current.id)
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400 dark:hover:bg-stone-900"
              }`}
            >
              <Flag
                className="size-3.5"
                weight={
                  current && starred.includes(current.id) ? "fill" : "regular"
                }
              />
              <span className="hidden sm:inline">Flag</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-stone-900 transition-all dark:bg-stone-100"
            style={{
              width: `${((index + 1) / sessionQuestions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {!current ? (
        <div className="p-6">
          <p className="text-[13px] text-stone-500">Loading…</p>
        </div>
      ) : (
        <div className="p-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 text-[12px] text-stone-500">
              {current.domain}
            </div>

            <h2 className="mb-3 text-[15px] leading-relaxed text-stone-950 dark:text-stone-50">
              {current.stem}
            </h2>

            {currentIsMulti && (
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-[4px] bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                Choose {currentRequired}
              </p>
            )}

            {showFeedback && isCurrentDisputed && (
              <div className="mb-4 rounded-[6px] border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Heads up — the published answer is disputed by the community.
                See the note in the explanation below.
              </div>
            )}

            <div className="space-y-2">
              {current.choices.map((choice, idx) => {
                const correctIdxs = correctAnswerIndices(current);
                const correctSet = new Set(correctIdxs);
                const userIdxs = answeredCurrent ?? [];
                const isUserChoice = userIdxs.includes(idx);
                const isPending =
                  !showFeedback && currentIsMulti && pendingMulti.includes(idx);
                const isCorrectChoice = correctSet.has(idx);
                const isSelected = isUserChoice || isPending;
                let style =
                  "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700 dark:hover:bg-stone-900";

                if (showFeedback) {
                  if (isCorrectChoice) {
                    style =
                      "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
                  } else if (isUserChoice && !isCorrectChoice) {
                    style =
                      "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40";
                  } else {
                    style =
                      "border-stone-200 bg-white opacity-50 dark:border-stone-800 dark:bg-stone-950";
                  }
                } else if (isSelected) {
                  style =
                    "border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-900";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={showFeedback || answeredCurrent !== undefined}
                    onClick={() => applyChoice(idx)}
                    className={`flex w-full items-start gap-3 rounded-[6px] border px-4 py-3 text-left text-[13px] transition-colors disabled:cursor-default ${style}`}
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[11px] font-semibold text-stone-600 dark:border-stone-600 dark:text-stone-400">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-stone-800 dark:text-stone-200">
                      {choice}
                    </span>
                    {showFeedback && isCorrectChoice && (
                      <CheckCircle
                        className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        weight="fill"
                      />
                    )}
                    {showFeedback && isUserChoice && !isCorrectChoice && (
                      <XCircle
                        className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
                        weight="fill"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {currentIsMulti && answeredCurrent === undefined && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[12px] text-stone-500">
                  {pendingMulti.length} of {currentRequired} selected
                </p>
                <button
                  type="button"
                  onClick={submitPendingMulti}
                  disabled={pendingMulti.length !== currentRequired}
                  className="btn-primary h-9"
                >
                  Submit answer
                </button>
              </div>
            )}

            {showFeedback && current.explanation && (
              <div className="mt-6 rounded-[6px] border border-[var(--border)] bg-stone-50 p-4 dark:bg-stone-900">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
                  Explanation
                </p>
                <p className="text-[13px] leading-relaxed text-stone-700 dark:text-stone-300">
                  {current.explanation}
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="btn-secondary h-9"
              >
                <ArrowLeft className="size-4" weight="bold" />
                Previous
              </button>

              {/* Show Finish on last question OR when all answered (exam mode) */}
              {isLastQuestion ||
              (sessionMode === "exam" &&
                allAnswered &&
                answeredCount === sessionQuestions.length) ? (
                <button
                  type="button"
                  onClick={completeSession}
                  disabled={
                    sessionMode === "study"
                      ? !showFeedback
                      : !allAnswered
                  }
                  className="btn-primary h-9"
                >
                  <Trophy className="size-4" weight="fill" />
                  {sessionMode === "exam" ? "Submit exam" : "Finish session"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    sessionMode === "study" && !showFeedback
                  }
                  onClick={() =>
                    setIndex((i) => Math.min(sessionQuestions.length - 1, i + 1))
                  }
                  className="btn-secondary h-9"
                >
                  Next
                  <ArrowRight className="size-4" weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={endSessionOpen}
        title="End this session?"
        description="If you go back, this practice run will end. Answers in this session are not saved to your score until you finish."
        confirmLabel="End session"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setEndSessionOpen(false)}
        onConfirm={() => {
          setEndSessionOpen(false);
          endSession();
        }}
      />
    </div>
  );
}

// ===== Subcomponents =====

function ModeCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border p-4 text-left transition-colors ${
        selected
          ? "border-stone-900 bg-stone-50 dark:border-stone-100 dark:bg-stone-900"
          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700 dark:hover:bg-stone-900"
      }`}
    >
      <p className="text-[13px] font-medium text-stone-950 dark:text-stone-50">
        {title}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
        {description}
      </p>
    </button>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "emerald" | "red" | "neutral";
}) {
  const toneStyles = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    red: "text-red-700 dark:text-red-400",
    neutral: "text-stone-900 dark:text-stone-100",
  };
  return (
    <div className="rounded-[6px] border border-[var(--border)] bg-white p-3 dark:bg-stone-950">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone-500">
        {label}
      </p>
      <p
        className={`mt-1 text-[20px] font-semibold tabular-nums ${toneStyles[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}
