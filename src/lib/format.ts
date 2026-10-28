import type { Locale } from './enums'

/**
 * Locale-aware formatting helpers built on Intl. Georgian month and weekday names are
 * spelled out by hand so they look the same in every browser.
 */

const INTL_LOCALE: Record<Locale, string> = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU' }

export const KA_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
] as const
export const KA_MONTHS_SHORT = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'] as const
/** Monday first. */
export const KA_WEEKDAYS_SHORT = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'] as const

/** Group digits with a space and append the lari sign: "12 345 ₾" (cents only when present). */
export function formatMoney(value: string | number | null | undefined, locale: Locale = 'ka'): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0)
  const safe = Number.isFinite(amount) ? amount : 0
  const hasCents = Math.round(Math.abs(safe) * 100) % 100 !== 0
  const [whole = '0', cents] = Math.abs(safe).toFixed(hasCents ? 2 : 0).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const separator = locale === 'en' ? '.' : ','
  const sign = safe < 0 ? '−' : ''
  return `${sign}${grouped}${cents ? separator + cents : ''} ₾`
}

/** Number with plain-space grouping in every locale: "12 345". */
export function formatNumber(value: number, locale: Locale = 'ka'): string {
  const [whole = '0', fraction] = Math.abs(value).toString().split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const separator = locale === 'en' ? '.' : ','
  return `${value < 0 ? '−' : ''}${grouped}${fraction ? separator + fraction : ''}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/** Parse "YYYY-MM-DD" as a local date (no timezone shift). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDate(value) : new Date(value)
}

export function monthName(monthIndex: number, locale: Locale, short = false): string {
  if (locale === 'ka') return (short ? KA_MONTHS_SHORT : KA_MONTHS)[monthIndex] ?? ''
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: short ? 'short' : 'long' }).format(new Date(2026, monthIndex, 1))
}

/** Weekday names starting Monday. */
export function weekdayNames(locale: Locale): string[] {
  if (locale === 'ka') return [...KA_WEEKDAYS_SHORT]
  const fmt = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short' })
  // 2026-01-05 is a Monday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 0, 5 + i)))
}

/** "12 მარ 2026" / "Mar 12, 2026" / "12 мар. 2026 г." */
export function formatDate(value: string | Date | null | undefined, locale: Locale = 'ka', opts: { withYear?: boolean } = {}): string {
  if (!value) return '—'
  const date = toDate(value)
  const withYear = opts.withYear ?? true
  if (locale === 'ka') {
    const base = `${date.getDate()} ${KA_MONTHS_SHORT[date.getMonth()] ?? ''}`
    return withYear ? `${base} ${date.getFullYear()}` : base
  }
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date)
}

/** "28 ოქტომბერი 2026, ოთხშაბათი"-style long date for hero headers. */
export function formatLongDate(value: Date, locale: Locale = 'ka'): string {
  if (locale === 'ka') {
    const weekday = KA_WEEKDAYS_SHORT[(value.getDay() + 6) % 7] ?? ''
    return `${weekday}, ${value.getDate()} ${KA_MONTHS[value.getMonth()] ?? ''} ${value.getFullYear()}`
  }
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(value)
}

export function formatDateTime(value: string | null | undefined, locale: Locale = 'ka'): string {
  if (!value) return '—'
  const date = new Date(value)
  const time = new Intl.DateTimeFormat(INTL_LOCALE[locale], { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  return `${formatDate(date, locale)} · ${time}`
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

/** "2 hours ago" / "2 საათის წინ" / "2 часа назад". */
export function formatRelative(value: string | Date, locale: Locale = 'ka', now: Date = new Date()): string {
  const seconds = Math.round((toDate(value).getTime() - now.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: 'auto' })
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size || unit === 'second') {
      return rtf.format(Math.round(seconds / size), unit)
    }
  }
  return rtf.format(0, 'second')
}

export function formatBytes(bytes: number, locale: Locale = 'ka'): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const digits = value >= 10 || unit === 0 ? 0 : 1
  return `${new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: digits }).format(value)} ${units[unit] ?? 'B'}`
}

/** Days from today to a date (negative = past). */
export function daysUntil(value: string, today: Date = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((parseDate(value).getTime() - start.getTime()) / 86_400_000)
}

export function isOverdue(value: string | null | undefined, today: Date = new Date()): boolean {
  return Boolean(value) && daysUntil(value ?? '', today) < 0
}
