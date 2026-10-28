import { describe, expect, it } from 'vitest'

import { barGeometry, barGradient, buildRange, rangeParams, shiftAnchor } from './timelineMath'

describe('timelineMath', () => {
  const range = buildRange(new Date(2026, 9, 28), 'month')

  it('builds a window starting one month before the anchor', () => {
    expect(rangeParams(range)).toEqual({ from: '2026-09-01', to: '2026-11-30' })
    expect(range.days).toBe(91)
    expect(range.months.map((m) => [m.month, m.offset, m.days])).toEqual([
      [8, 0, 30],
      [9, 30, 31],
      [10, 61, 30],
    ])
  })

  it('positions and clips bars', () => {
    expect(barGeometry('2026-09-02', '2026-09-03', range, 10)).toMatchObject({ left: 10, width: 20, clippedStart: false })
    expect(barGeometry('2026-08-01', '2026-09-01', range, 10)).toMatchObject({ left: 0, width: 10, clippedStart: true })
    expect(barGeometry('2027-01-01', '2027-02-01', range, 10)).toBeNull()
    expect(barGeometry(null, null, range, 10)).toBeNull()
  })

  it('uses the status gradients from the design spec', () => {
    expect(barGradient('done')).toBe('from-success to-primary')
    expect(barGradient('blocked')).toBe('from-danger to-warning')
    expect(barGradient('review')).toBe('from-warning to-primary')
    expect(barGradient('todo')).toBe('from-primary to-info')
  })

  it('shifts by one month or a quarter', () => {
    expect(shiftAnchor(new Date(2026, 9, 28), 'month', 1).getMonth()).toBe(10)
    expect(shiftAnchor(new Date(2026, 9, 28), 'quarter', -1).getMonth()).toBe(6)
  })
})
