import { parseDate, toIsoDate } from '@/lib/format'
import type { Status } from '@/lib/enums'

export type Zoom = 'month' | 'quarter'

/** Visible window and pixel scale per zoom level. */
export const ZOOM_CONFIG: Record<Zoom, { months: number; dayWidth: number; step: number }> = {
  month: { months: 3, dayWidth: 26, step: 1 },
  quarter: { months: 9, dayWidth: 8, step: 3 },
}

export interface MonthSpan {
  year: number
  month: number
  /** Offset in days from the window start. */
  offset: number
  days: number
}

export interface TimelineRange {
  from: Date
  to: Date
  days: number
  months: MonthSpan[]
}

const DAY = 86_400_000

export function daysBetween(a: Date, b: Date): number {
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY)
}

/** Window starting one month before `anchor`'s month, `months` long. */
export function buildRange(anchor: Date, zoom: Zoom): TimelineRange {
  const { months: count } = ZOOM_CONFIG[zoom]
  const from = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
  const to = new Date(from.getFullYear(), from.getMonth() + count, 0)
  const months: MonthSpan[] = []
  for (let i = 0; i < count; i++) {
    const start = new Date(from.getFullYear(), from.getMonth() + i, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    months.push({ year: start.getFullYear(), month: start.getMonth(), offset: daysBetween(from, start), days: end.getDate() })
  }
  return { from, to, days: daysBetween(from, to) + 1, months }
}

export function rangeParams(range: TimelineRange): { from: string; to: string } {
  return { from: toIsoDate(range.from), to: toIsoDate(range.to) }
}

/**
 * Bar position in px for an inclusive [start, end] date span, clipped to the window.
 * Returns null when the span is missing or entirely outside the window.
 */
export function barGeometry(
  start: string | null | undefined,
  end: string | null | undefined,
  range: TimelineRange,
  dayWidth: number,
): { left: number; width: number; clippedStart: boolean; clippedEnd: boolean } | null {
  if (!start && !end) return null
  const s = parseDate(start ?? end ?? '')
  const e = parseDate(end ?? start ?? '')
  const startDay = daysBetween(range.from, s)
  const endDay = daysBetween(range.from, e)
  if (endDay < 0 || startDay > range.days - 1) return null
  const from = Math.max(0, startDay)
  const to = Math.min(range.days - 1, endDay)
  return { left: from * dayWidth, width: Math.max(dayWidth, (to - from + 1) * dayWidth), clippedStart: startDay < 0, clippedEnd: endDay > range.days - 1 }
}

/** Bar gradient per status (design spec). */
export function barGradient(status: Status): string {
  switch (status) {
    case 'done':
      return 'from-success to-primary'
    case 'blocked':
      return 'from-danger to-warning'
    case 'review':
      return 'from-warning to-primary'
    default:
      return 'from-primary to-info'
  }
}

export function shiftAnchor(anchor: Date, zoom: Zoom, direction: 1 | -1): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + direction * ZOOM_CONFIG[zoom].step, 1)
}
