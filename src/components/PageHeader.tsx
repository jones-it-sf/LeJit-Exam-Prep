import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type PageHeaderProps = {
  breadcrumbs: { label: string; to?: string }[];
  actions?: ReactNode;
};

/** Sub-header: breadcrumbs + actions (matches design direction) */
export default function PageHeader({ breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="sticky top-16 z-10 border-b border-stone-200/80 bg-[var(--bg-content)]/80 px-4 py-4 backdrop-blur dark:border-stone-800">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumbs" className="text-[12px]">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-500">
            {breadcrumbs.map((crumb, idx) => (
              <li key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
                {crumb.to ? (
                  <Link to={crumb.to} className="link-stone">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-stone-900 dark:text-stone-50">
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 ? (
                  <span className="text-stone-300 dark:text-stone-600">/</span>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-2">{actions ?? null}</div>
      </div>
    </div>
  );
}
