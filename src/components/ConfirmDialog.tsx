import { useEffect, useId, useRef } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Primary action (right side) — e.g. destructive confirm */
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel: string;
  /**
   * `danger` styles the primary button to signal irreversible or harmful actions.
   */
  tone?: "default" | "danger";
}

/**
 * In-app replacement for `window.confirm`, aligned with the app surface styles.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  tone = "default",
}: ConfirmDialogProps) {
  const id = useId();
  const descId = `${id}-description`;
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-[400px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-content)] p-5 shadow-lg"
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={id} className="text-[15px] font-semibold text-stone-950 dark:text-stone-50">
          {title}
        </h2>
        <p
          id={descId}
          className="mt-2 text-[13px] leading-relaxed text-stone-600 dark:text-stone-400"
        >
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn-secondary h-9 w-full sm:w-auto"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`h-9 w-full sm:w-auto ${
              tone === "danger"
                ? "inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-3.5 text-[13px] font-medium text-red-800 transition-[background,border,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 dark:hover:bg-red-950/80"
                : "btn-primary"
            }`}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
