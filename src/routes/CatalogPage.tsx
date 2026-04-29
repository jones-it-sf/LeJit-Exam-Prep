import { ArrowRight, BookOpen } from "@phosphor-icons/react/ssr";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCatalog } from "@/lib/content";
import type { CatalogEntry } from "@/types/exam";

export default function CatalogPage() {
  const [rows, setRows] = useState<CatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog()
      .then((catalog) => setRows([...catalog.exams]))
      .catch(() => setError("Could not load the catalog."));
  }, []);

  return (
    <div>
      <div className="border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-[14px] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          Exam catalog
        </h1>
        <p className="mt-0.5 text-[13px] text-stone-500">
          Choose a certification to start practicing
        </p>
      </div>

      <div className="p-6">
        {error ? (
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        ) : rows === null ? (
          <p className="text-[13px] text-stone-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 inline-flex size-12 items-center justify-center rounded-[6px] border border-[var(--border)] bg-stone-50 dark:bg-stone-900">
              <BookOpen className="size-5 text-stone-400" weight="fill" />
            </div>
            <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
              No exams available
            </p>
            <p className="mt-1 max-w-[280px] text-[13px] text-stone-500">
              Add exam JSON files under{" "}
              <code className="rounded-[2px] bg-stone-100 px-1 text-[12px] dark:bg-stone-900">
                public/content/exams/
              </code>
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((exam) => (
              <Link
                key={exam.slug}
                to={`/exams/${exam.slug}/practice`}
                className="group flex flex-col rounded-[6px] border border-[var(--border)] bg-white p-4 transition-all hover:border-stone-300 hover:bg-stone-50 dark:bg-stone-950 dark:hover:border-stone-700 dark:hover:bg-stone-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="inline-flex h-5 items-center rounded-[4px] border border-[var(--border)] bg-stone-50 px-1.5 text-[11px] font-medium text-stone-600 dark:bg-stone-900 dark:text-stone-400">
                    {exam.vendor}
                  </span>
                  <ArrowRight
                    className="size-4 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-700 dark:group-hover:text-stone-300"
                    weight="bold"
                  />
                </div>
                <h2 className="text-[14px] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                  {exam.title}
                </h2>
                <p className="mt-1 text-[13px] text-stone-500">
                  {exam.questionCount.toLocaleString()} questions
                </p>
                {exam.domains && exam.domains.length > 0 ? (
                  <p className="mt-3 text-[12px] text-stone-500">
                    {exam.domains.length} domains
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
