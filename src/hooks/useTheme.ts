import { useEffect, useMemo, useState } from "react";

export type ResolvedScheme = "light" | "dark";

export type Preference = ResolvedScheme | "system";

function readPreference(): Preference {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem("exam-practice-theme");
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function systemMatchesDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Saves preference and toggles `.dark` on `<html>` */
export function useTheme() {
  const [preference, setPreferenceState] = useState<Preference>(readPreference);

  useEffect(() => {
    localStorage.setItem("exam-practice-theme", preference);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let dark = false;
      if (preference === "dark") dark = true;
      else if (preference === "light") dark = false;
      else dark = mq.matches;
      if (dark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [preference]);

  const resolved = useMemo((): ResolvedScheme => {
    if (preference === "light" || preference === "dark") return preference;
    return systemMatchesDark() ? "dark" : "light";
  }, [preference]);

  function setPreference(p: Preference) {
    setPreferenceState(p);
  }

  function toggleBetweenLightDark() {
    const next: ResolvedScheme = resolved === "dark" ? "light" : "dark";
    setPreferenceState(next);
  }

  return {
    theme: preference,
    resolvedDark: resolved === "dark",
    setPreference,
    toggle: toggleBetweenLightDark,
  };
}
