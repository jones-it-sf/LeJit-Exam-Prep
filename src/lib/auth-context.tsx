import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthState } from "./auth.ts";
import {
  clearAuth,
  getExpectedAuthHashHex,
  isAuthBypassAllowed,
  persistAuth,
  readStoredUnlock,
} from "./auth.ts";
import { sha256Hex } from "./hash.ts";

type AuthCtx = {
  state: AuthState;
  login: (
    passphrase: string,
    rememberDevice: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  authConfigured: boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);

/** Constant-time-ish compare for equal-length hex strings */
function timingSafeEqualAsciiHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const expectedHash = getExpectedAuthHashHex();
  const bypass = isAuthBypassAllowed();
  const authConfigured = Boolean(expectedHash) || bypass;

  useEffect(() => {
    if (bypass) {
      setUnlocked(true);
      return;
    }
    if (expectedHash && readStoredUnlock()) {
      setUnlocked(true);
    }
  }, [bypass, expectedHash]);

  const login = useCallback(
    async (passphrase: string, rememberDevice: boolean) => {
      if (bypass) {
        persistAuth(rememberDevice);
        setUnlocked(true);
        return { ok: true };
      }
      if (!expectedHash) {
        return {
          ok: false,
          error:
            "This build has no passphrase configured (missing VITE_AUTH_HASH_HEX).",
        };
      }
      const trimmed = passphrase.trim();
      if (!trimmed) {
        return { ok: false, error: "Enter the team passphrase." };
      }
      const hash = await sha256Hex(trimmed);
      const ok = timingSafeEqualAsciiHex(
        hash.toLowerCase(),
        expectedHash.toLowerCase(),
      );
      if (!ok) {
        return { ok: false, error: "That passphrase is not valid." };
      }
      persistAuth(rememberDevice);
      setUnlocked(true);
      return { ok: true };
    },
    [bypass, expectedHash],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUnlocked(false);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      state: { unlocked },
      login,
      logout,
      authConfigured,
    }),
    [unlocked, login, logout, authConfigured],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
