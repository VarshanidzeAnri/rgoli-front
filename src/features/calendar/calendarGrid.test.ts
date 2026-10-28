import { describe, expect, it } from 'vitest'

import type { CalendarEvent } from '@/types/api'

import { buildMonthGrid, eventLink, gridRange, groupByDate, upcoming } from './calendarGrid'

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  type: 'task',
  id: 1,
  date: '2026-10-30',
  title: 'T',
  key: 'URK-1',
  status: 'todo',
  priority: 'medium',
  project_id: 1,
  ...over,
})

describe('calendarGrid', () => {
  it('builds 42 days starting on Monday', () => {
    const grid = buildMonthGrid(2026, 9, new Date(2026, 9, 28))
    expect(grid).toHaveLength(42)
    expect(grid[0]?.date.getDay()).toBe(1)
    expect(gridRange(grid)).toEqual({ from: '2026-09-28', to: '2026-11-08' })
    expect(grid.find((d) => d.isToday)?.iso).toBe('2026-10-28')
    expect(grid.filter((d) => d.inMonth)).toHaveLength(31)
  })

  it('groups events by date with milestones first', () => {
    const map = groupByDate([ev({ id: 1 }), ev({ id: 2, type: 'milestone' })])
    expect(map.get('2026-10-30')?.map((e) => e.type)).toEqual(['milestone', 'task'])
  })

  it('lists upcoming open events and links them', () => {
    const today = new Date(2026, 9, 28)
    const list = upcoming([ev({ id: 1, date: '2026-10-20' }), ev({ id: 2, date: '2026-11-02' }), ev({ id: 3, date: '2026-10-29', status: 'done' })], today)
    expect(list.map((e) => e.id)).toEqual([2])
    expect(eventLink(ev({ id: 5 }))).toBe('/board?issue=5')
    expect(eventLink(ev({ type: 'milestone', project_id: 7 }))).toBe('/projects/7')
  })
})
