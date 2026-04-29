/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_HASH_HEX?: string;
  readonly VITE_ALLOW_UNAUTH?: string;
  readonly VITE_PAGES_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
