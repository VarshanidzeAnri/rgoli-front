import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, SquareCheckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState, ErrorState, Panel, Pill, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger, Skeleton } from '@/components/ui/misc'
import { useGetCalendarQuery } from '@/features/workspace/api'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/types/api'

import { buildMonthGrid, eventLink, gridRange, groupByDate, upcoming } from './calendarGrid'

const MAX_CHIPS = 2

function EventChip({ event }: { event: CalendarEvent }) {
  const milestone = event.type === 'milestone'
  return (
    <Link
      to={eventLink(event)}
      title={`${event.key} · ${event.title}`}
      className={cn(
        'block truncate rounded-md border px-1.5 py-0.5 text-[10.5px] leading-tight transition hover:brightness-110',
        milestone ? 'border-violet/30 bg-violet/10 text-violet' : 'border-primary/30 bg-primary/10 text-primary',
        event.status === 'done' && 'line-through opacity-60',
      )}
    >
      {event.title}
    </Link>
  )
}

/** Month grid (Monday first) with task deadlines and project milestones, plus an upcoming list. */
export function CalendarView() {
  const { t } = useTranslation(['calendar', 'common'])
  const f = useFormat()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])
  const { data: events = [], isLoading, isError, refetch } = useGetCalendarQuery(gridRange(grid))
  const byDate = useMemo(() => groupByDate(events), [events])
  const soon = useMemo(() => upcoming(events), [events])
  const weekdays = f.weekdays()

  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  return (
    <div className="flex flex-col gap-5">
      <Panel
        title={`${f.month(cursor.month)} ${cursor.year}`}
        actions={
          <>
            <span className="hidden items-center gap-3 sm:flex">
              <Pill tone="primary" dot>
                {t('legend.task')}
              </Pill>
              <Pill tone="violet" dot>
                {t('legend.milestone')}
              </Pill>
            </span>
            <Button size="icon-sm" onClick={() => shift(-1)} aria-label={t('common:actions.previous')}>
              <ChevronLeftIcon />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const now = new Date()
                setCursor({ year: now.getFullYear(), month: now.getMonth() })
              }}
            >
              {t('common:actions.today')}
            </Button>
            <Button size="icon-sm" onClick={() => shift(1)} aria-label={t('common:actions.next')}>
              <ChevronRightIcon />
            </Button>
          </>
        }
        bodyClassName="p-0"
      >
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <div role="grid" aria-label={t('grid')} className="grid min-w-[700px] grid-cols-7">
              <div role="row" className="contents">
                {weekdays.map((w) => (
                  <div key={w} role="columnheader" className="micro-label border-b border-border/50 px-2 py-2.5 text-center">
                    {w}
                  </div>
                ))}
              </div>
              {Array.from({ length: 6 }, (_, week) => (
                <div key={week} role="row" className="contents">
                  {grid.slice(week * 7, week * 7 + 7).map((day) => {
                    const dayEvents = byDate.get(day.iso) ?? []
                    const shown = dayEvents.slice(0, MAX_CHIPS)
                    const rest = dayEvents.length - shown.length
                    return (
                      <div
                        key={day.iso}
                        role="gridcell"
                        aria-label={t('dayLabel', { date: f.date(day.date), count: dayEvents.length })}
                        className={cn('flex min-h-24 flex-col gap-1 border-r border-b border-border/40 p-1.5 last:border-r-0', !day.inMonth && 'bg-secondary/15')}
                      >
                        <span
                          className={cn(
                            'num inline-flex size-6 items-center justify-center self-end rounded-full text-[11px]',
                            day.isToday ? 'bg-primary font-semibold text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.6)]' : day.inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                        {isLoading ? <Skeleton className="h-4" /> : null}
                        {shown.map((e) => (
                          <EventChip key={`${e.type}-${e.id}`} event={e} />
                        ))}
                        {rest > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="self-start rounded-md px-1.5 text-[10.5px] text-muted-foreground hover:text-foreground" aria-label={t('moreLabel', { count: rest })}>
                                {t('more', { count: rest })}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="flex w-64 flex-col gap-1.5">
                              <p className="micro-label">{f.date(day.date)}</p>
                              {dayEvents.map((e) => (
                                <EventChip key={`${e.type}-${e.id}`} event={e} />
                              ))}
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title={t('upcoming')}>
        {soon.length === 0 ? (
          <EmptyState text={t('upcomingEmpty')} className="py-8" />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {soon.map((e) => (
              <li key={`${e.type}-${e.id}`}>
                <Link to={eventLink(e)} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-secondary/40">
                  {e.type === 'milestone' ? (
                    <FlagIcon className="size-4 shrink-0 text-violet" aria-label={t('legend.milestone')} />
                  ) : (
                    <SquareCheckIcon className="size-4 shrink-0 text-primary" aria-label={t('legend.task')} />
                  )}
                  <span className="num w-20 shrink-0 text-[11px] text-muted-foreground">{f.date(e.date, false)}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{e.key}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{e.title}</span>
                  {e.type === 'task' ? <StatusPill status={e.status} /> : <Pill tone="violet">{t('milestone')}</Pill>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
