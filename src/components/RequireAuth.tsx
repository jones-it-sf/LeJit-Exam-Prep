import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/** Wraps gated routes — sends unauthenticated visitors to `/login`. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state, authConfigured } = useAuth();
  const location = useLocation();

  if (!authConfigured && !import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-[13px] text-stone-500">
        <p className="font-semibold text-stone-950 dark:text-stone-100">
          Access is not configured
        </p>
        <p className="mt-3 leading-relaxed">
          This static build was produced without a passphrase hash baked in. In GitHub
          Actions, set a repository secret{" "}
          <code className="rounded-[2px] border border-stone-300 bg-stone-100 px-1 dark:border-stone-700 dark:bg-stone-900">
            EXAM_AUTH_HASH_HEX
          </code>{" "}
          (or{" "}
          <code className="rounded-[2px] border border-stone-300 bg-stone-100 px-1 dark:border-stone-700 dark:bg-stone-900">
            VITE_AUTH_HASH_HEX
          </code>
          ) to the 64‑character hex from{" "}
          <code className="rounded-[2px] border border-stone-300 bg-stone-100 px-1 dark:border-stone-700 dark:bg-stone-900">
            npm run gen-auth-hash
          </code>
          , then redeploy. See <code className="text-[12px]">DEPLOYMENT.md</code> in
          the repo.
        </p>
      </div>
    );
  }

  if (!state.unlocked) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return children;
}
