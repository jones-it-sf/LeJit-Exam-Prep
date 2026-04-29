import { Moon, SignOut, Sun } from "@phosphor-icons/react/ssr";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/hooks/useTheme";

export default function AppShell() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggle, resolvedDark } = useTheme();

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-app)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-content)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-2.5">
          <Link
            to="/"
            className="text-[14px] font-semibold tracking-tight text-stone-950 dark:text-stone-50"
          >
            LeJit Exam Prep
          </Link>
          <nav className="flex items-center gap-1" aria-label="Actions">
            <button
              type="button"
              aria-label={resolvedDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex size-8 items-center justify-center rounded-[6px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
              onClick={() => toggle()}
            >
              {resolvedDark ? (
                <Sun className="size-4" weight="fill" />
              ) : (
                <Moon className="size-4" weight="fill" />
              )}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
            >
              <SignOut className="size-4" weight="fill" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="p-2 pb-20">
        <div className="mx-auto max-w-[1480px]">
          <div className="rounded-[2px] border border-[var(--border)] bg-[var(--bg-content)]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
