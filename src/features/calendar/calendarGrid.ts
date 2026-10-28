import { toIsoDate } from '@/lib/format'
import type { CalendarEvent } from '@/types/api'

export interface GridDay {
  date: Date
  iso: string
  inMonth: boolean
  isToday: boolean
}

/** 6 × 7 = 42 days covering the month, weeks starting on Monday. */
export function buildMonthGrid(year: number, month: number, today: Date = new Date()): GridDay[] {
  const first = new Date(year, month, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - mondayOffset)
  const todayIso = toIsoDate(today)
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const iso = toIsoDate(date)
    return { date, iso, inMonth: date.getMonth() === month, isToday: iso === todayIso }
  })
}

export function gridRange(grid: GridDay[]): { from: string; to: string } {
  return { from: grid[0]?.iso ?? '', to: grid[grid.length - 1]?.iso ?? '' }
}

/** Events grouped by ISO date, milestones first. */
export function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const list = map.get(event.date) ?? []
    list.push(event)
    map.set(event.date, list)
  }
  for (const list of map.values()) list.sort((a, b) => (a.type === b.type ? 0 : a.type === 'milestone' ? -1 : 1))
  return map
}

/** Events from today on, soonest first. */
export function upcoming(events: CalendarEvent[], today: Date = new Date(), limit = 8): CalendarEvent[] {
  const iso = toIsoDate(today)
  return events
    .filter((e) => e.date >= iso && e.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
}

export function eventLink(event: CalendarEvent): string {
  return event.type === 'task' ? `/board?issue=${event.id}` : `/projects/${event.project_id}`
}
