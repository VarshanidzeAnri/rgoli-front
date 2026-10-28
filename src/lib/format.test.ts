import { describe, expect, it } from 'vitest'

import { daysUntil, formatBytes, formatDate, formatMoney, formatNumber, formatRelative, isOverdue, monthName, weekdayNames } from './format'

describe('formatMoney', () => {
  it('groups with spaces and appends the lari sign in every language', () => {
    expect(formatMoney('12345.00', 'ka')).toBe('12 345 ₾')
    expect(formatMoney(12345, 'en')).toBe('12 345 ₾')
    expect(formatMoney('1234567', 'ru')).toBe('1 234 567 ₾')
  })

  it('shows cents only when present, with the locale decimal separator', () => {
    expect(formatMoney('1000.10', 'en')).toBe('1 000.10 ₾')
    expect(formatMoney('1000.10', 'ka')).toBe('1 000,10 ₾')
  })

  it('handles zero, null and negatives', () => {
    expect(formatMoney(null)).toBe('0 ₾')
    expect(formatMoney('-500')).toBe('−500 ₾')
  })
})

describe('dates', () => {
  it('uses Georgian month names', () => {
    expect(formatDate('2026-03-12', 'ka')).toBe('12 მარ 2026')
    expect(monthName(0, 'ka')).toBe('იანვარი')
    expect(monthName(11, 'ka', true)).toBe('დეკ')
  })

  it('starts weeks on Monday', () => {
    expect(weekdayNames('ka')).toEqual(['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'])
    expect(weekdayNames('en')[0]).toBe('Mon')
  })

  it('computes days until and overdue', () => {
    const today = new Date(2026, 9, 28)
    expect(daysUntil('2026-10-30', today)).toBe(2)
    expect(isOverdue('2026-10-27', today)).toBe(true)
    expect(isOverdue('2026-10-28', today)).toBe(false)
    expect(isOverdue(null, today)).toBe(false)
  })

  it('formats relative time', () => {
    const now = new Date('2026-10-28T12:00:00Z')
    expect(formatRelative('2026-10-28T10:00:00Z', 'en', now)).toBe('2 hours ago')
  })
})

describe('numbers', () => {
  it('formats numbers and bytes', () => {
    expect(formatNumber(1234567)).toBe('1 234 567')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536, 'en')).toBe('1.5 KB')
  })
})
