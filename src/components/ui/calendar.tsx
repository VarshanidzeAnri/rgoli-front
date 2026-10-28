import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { type ComponentProps } from 'react'
import { DayPicker } from 'react-day-picker'
import { enUS, ka, ru } from 'date-fns/locale'

import { cn } from '@/lib/cn'
import { monthName, weekdayNames } from '@/lib/format'
import { useAppSelector } from '@/store'
import { selectLocale } from '@/store/uiSlice'

const DATE_FNS_LOCALE = { ka, en: enUS, ru } as const

/**
 * Themed react-day-picker. Monday-first, month/weekday names from lib/format
 * (Georgian names exactly as in the design spec).
 */
export function Calendar({ className, classNames, ...props }: ComponentProps<typeof DayPicker>) {
  const locale = useAppSelector(selectLocale)
  const weekdays = weekdayNames(locale)

  return (
    <DayPicker
      locale={DATE_FNS_LOCALE[locale]}
      weekStartsOn={1}
      showOutsideDays
      formatters={{
        formatCaption: (date) => `${monthName(date.getMonth(), locale)} ${date.getFullYear()}`,
        formatWeekdayName: (date) => weekdays[(date.getDay() + 6) % 7] ?? '',
      }}
      className={cn('p-1', className)}
      classNames={{
        months: 'relative flex flex-col',
        month: 'flex flex-col gap-3',
        month_caption: 'flex h-8 items-center justify-center px-9',
        caption_label: 'text-[13px] font-semibold',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-9 pb-1 text-center text-[10.5px] font-medium text-muted-foreground',
        week: 'mt-1 flex',
        day: 'size-9 p-0 text-center text-[12.5px]',
        day_button:
          'num inline-flex size-9 items-center justify-center rounded-xl transition outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring',
        selected:
          '[&>button]:bg-gradient-to-br [&>button]:from-primary [&>button]:to-info [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:brightness-110',
        today: '[&>button]:border [&>button]:border-primary/60 [&>button]:text-primary',
        outside: 'text-muted-foreground/40',
        disabled: 'opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? <ChevronLeftIcon className="size-4" /> : <ChevronRightIcon className="size-4" />,
      }}
      {...props}
    />
  )
}
