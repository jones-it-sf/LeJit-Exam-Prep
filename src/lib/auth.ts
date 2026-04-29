const STORAGE_KEY_AUTH = "exam-practice-auth";
const STORAGE_KEY_REMEMBER = "exam-practice-remember-devices";

/** Set when passphrase matches configured build-time hash */
export type AuthState = {
  unlocked: boolean;
};

export function persistAuth(rememberDevice: boolean): void {
  if (rememberDevice) {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.setItem(STORAGE_KEY_REMEMBER, "1");
    localStorage.setItem(STORAGE_KEY_AUTH, "1");
  } else {
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.setItem(STORAGE_KEY_AUTH, "1");
  }
}

export function clearAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_REMEMBER);
}

export function readStoredUnlock(): boolean {
  if (sessionStorage.getItem(STORAGE_KEY_AUTH) === "1") {
    return true;
  }
  return (
    localStorage.getItem(STORAGE_KEY_REMEMBER) === "1" &&
    localStorage.getItem(STORAGE_KEY_AUTH) === "1"
  );
}

export function getExpectedAuthHashHex(): string | undefined {
  const v = import.meta.env.VITE_AUTH_HASH_HEX?.trim();
  return v?.length ? v : undefined;
}

/** Without configured hash — local dev only */
export function isAuthBypassAllowed(): boolean {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_ALLOW_UNAUTH === "true");
}
