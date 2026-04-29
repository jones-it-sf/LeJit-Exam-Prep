import { Lock } from "@phosphor-icons/react/ssr";
import { FormEvent, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { state, login, authConfigured } = useAuth();
  const [search] = useSearchParams();
  const next = search.get("next") || "/";

  const [passphrase, setPassphrase] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (state.unlocked && next.startsWith("/")) {
    return <Navigate to={next} replace />;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setPending(true);
    setError(null);
    const result = await login(passphrase, remember);
    setPending(false);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-app)] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-content)] p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-[6px] border border-[var(--border)] bg-stone-50 dark:bg-stone-900">
              <Lock className="size-5 text-stone-500" weight="fill" />
            </div>
            <h1 className="text-[18px] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
              LeJit Exam Prep
            </h1>
            <p className="mt-1 text-[13px] text-stone-500">
              Enter passphrase to continue
            </p>
          </div>

          {!authConfigured ? (
            <div className="mb-6 rounded-[6px] border border-[var(--border)] bg-stone-50 p-3 text-[12px] text-stone-600 dark:bg-stone-900 dark:text-stone-400">
              Auth not configured. Set{" "}
              <code className="rounded-[2px] bg-white px-1 dark:bg-stone-950">
                VITE_AUTH_HASH_HEX
              </code>{" "}
              in your environment.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="pass"
                className="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300"
              >
                Passphrase
              </label>
              <input
                id="pass"
                type="password"
                autoComplete="current-password"
                spellCheck={false}
                placeholder="Enter passphrase"
                className="h-10 w-full rounded-[6px] border border-stone-300 bg-white px-3 text-[13px] text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-stone-500 dark:focus:ring-stone-800"
                value={passphrase}
                onChange={(ev) => setPassphrase(ev.target.value)}
                autoFocus
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-[6px] border border-[var(--border)] bg-white px-3 py-2.5 transition-colors hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900">
              <input
                type="checkbox"
                checked={remember}
                onChange={(ev) => setRemember(ev.target.checked)}
                className="size-4 accent-stone-900 dark:accent-stone-100"
              />
              <span className="text-[13px] text-stone-700 dark:text-stone-300">
                Remember this device
              </span>
            </label>

            {error ? (
              <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="btn-primary h-10 w-full"
            >
              {pending ? "Signing in…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
