import { useMemo } from 'react'

import * as format from '@/lib/format'
import { useAppSelector } from '@/store'
import { selectLocale } from '@/store/uiSlice'

/** Formatting helpers bound to the current UI language. */
export function useFormat() {
  const locale = useAppSelector(selectLocale)
  return useMemo(
    () => ({
      locale,
      money: (v: string | number | null | undefined) => format.formatMoney(v, locale),
      number: (v: number) => format.formatNumber(v, locale),
      date: (v: string | Date | null | undefined, withYear = true) => format.formatDate(v, locale, { withYear }),
      dateTime: (v: string | null | undefined) => format.formatDateTime(v, locale),
      longDate: (v: Date) => format.formatLongDate(v, locale),
      relative: (v: string | Date) => format.formatRelative(v, locale),
      bytes: (v: number) => format.formatBytes(v, locale),
      month: (i: number, short = false) => format.monthName(i, locale, short),
      weekdays: () => format.weekdayNames(locale),
    }),
    [locale],
  )
}
