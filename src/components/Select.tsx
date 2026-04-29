import { CaretDown, Check } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-[6px] border border-stone-200 bg-white px-3 text-left text-[13px] text-stone-900 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:hover:border-stone-700 dark:hover:bg-stone-900"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <CaretDown
          className={`size-3.5 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          weight="bold"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-[180px] overflow-auto rounded-[6px] border border-stone-200 bg-white py-1 shadow-md dark:border-stone-800 dark:bg-stone-950">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                  isSelected
                    ? "bg-stone-50 font-medium text-stone-950 dark:bg-stone-900 dark:text-stone-50"
                    : "text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-900"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? (
                  <Check className="size-3.5 shrink-0 text-stone-700 dark:text-stone-300" weight="bold" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
