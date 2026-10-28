/**
 * Safe localStorage access. Storage can throw (private mode, blocked site data),
 * so every read/write is guarded and the app keeps working without it.
 */
export const STORAGE_KEYS = {
  token: 'rgoli.token',
  locale: 'rgoli.locale',
  theme: 'rgoli.theme',
  sidebarOpen: 'rgoli.sidebarOpen',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export function readStorage(key: StorageKey): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: StorageKey, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Ignore: preferences are a convenience, not required state.
  }
}
