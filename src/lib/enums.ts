/** Enum values exactly as stored by the API (English). Labels come from i18n `enums.json`. */
export const STATUSES = ['todo', 'progress', 'review', 'blocked', 'done'] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type Priority = (typeof PRIORITIES)[number]

export const PAYMENT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const DISCIPLINES = ['architecture', 'interior', 'construction', 'finance'] as const
export type Discipline = (typeof DISCIPLINES)[number]

export const FILE_TYPES = ['pdf', 'dwg', 'image', 'doc', 'zip', 'other'] as const
export type FileType = (typeof FILE_TYPES)[number]

export const SPRINT_STATES = ['planned', 'active', 'completed'] as const
export type SprintState = (typeof SPRINT_STATES)[number]

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'other'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const LOCALES = ['ka', 'en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

/** Semantic tone for each enum value (design system section 7). */
export type Tone = 'primary' | 'info' | 'warning' | 'danger' | 'success' | 'violet' | 'muted'

export const STATUS_TONE: Record<Status, Tone> = {
  todo: 'info',
  progress: 'primary',
  review: 'warning',
  blocked: 'danger',
  done: 'success',
}

export const PRIORITY_TONE: Record<Priority, Tone> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
}

export const DISCIPLINE_TONE: Record<Discipline, Tone> = {
  architecture: 'primary',
  interior: 'violet',
  construction: 'warning',
  finance: 'info',
}

export const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export const FILE_TYPE_TONE: Record<FileType, Tone> = {
  pdf: 'danger',
  dwg: 'info',
  image: 'violet',
  doc: 'primary',
  zip: 'warning',
  other: 'muted',
}
