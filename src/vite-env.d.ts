/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin without /api/v1; empty = same origin (Vite proxy in dev). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
