import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState, StatusPill } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import type { Status } from '@/lib/enums'
import type { Project } from '@/types/api'

import { barGeometry, barGradient, daysBetween, type TimelineRange } from './timelineMath'

const LABEL_WIDTH = 240

function Bar({
  start,
  end,
  status,
  range,
  dayWidth,
  label,
  progress,
  caption,
  thin = false,
}: {
  start: string | null
  end: string | null
  status: Status
  range: TimelineRange
  dayWidth: number
  label: string
  progress?: number
  caption?: string
  thin?: boolean
}) {
  const f = useFormat()
  const { t } = useTranslation('timeline')
  const geo = barGeometry(start, end, range, dayWidth)
  if (!geo) return null
  return (
    <div
      role="img"
      aria-label={t('barLabel', { name: label, start: f.date(start), end: f.date(end), progress: progress ?? 0 })}
      className={cn(
        'absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden bg-gradient-to-r px-2.5 text-primary-foreground shadow-[0_6px_18px_-10px_hsl(var(--primary)/0.8)]',
        barGradient(status),
        thin ? 'h-4 rounded-full opacity-80' : 'h-7 rounded-full',
        geo.clippedStart && 'rounded-l-none',
        geo.clippedEnd && 'rounded-r-none',
      )}
      style={{ left: geo.left, width: geo.width }}
      title={label}
    >
      {!thin && geo.width > 90 ? (
        <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium">
          {caption ? <span className="truncate">{caption}</span> : null}
          {progress !== undefined ? <span className="num shrink-0 opacity-80">{progress}%</span> : null}
        </span>
      ) : null}
    </div>
  )
}

/** Gantt: rows = projects (expandable to phases), month header, glowing today line, horizontal scroll. */
export function Gantt({ projects, range, dayWidth }: { projects: Project[]; range: TimelineRange; dayWidth: number }) {
  const { t } = useTranslation('timeline')
  const f = useFormat()
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  const width = range.days * dayWidth
  const todayOffset = daysBetween(range.from, new Date())
  const showToday = todayOffset >= 0 && todayOffset < range.days

  if (projects.length === 0) return <EmptyState text={t('empty')} />

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: LABEL_WIDTH + width, minWidth: '100%' }}>
        {/* Month header */}
        <div className="sticky top-0 z-10 flex border-b border-border/60 bg-card/70 backdrop-blur">
          <div className="micro-label sticky left-0 z-20 flex shrink-0 items-end bg-card/90 px-4 pb-2" style={{ width: LABEL_WIDTH }}>
            {t('project')}
          </div>
          <div className="relative h-11" style={{ width }}>
            {range.months.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="absolute top-0 flex h-full items-end border-l border-border/50 px-2 pb-2"
                style={{ left: m.offset * dayWidth, width: m.days * dayWidth }}
              >
                <span className="truncate font-mono text-[10.5px] tracking-wider text-muted-foreground uppercase">
                  {f.month(m.month, dayWidth < 12)} {m.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="relative">
          {projects.map((project) => {
            const isOpen = expanded.has(project.id)
            const phases = project.phases ?? []
            return (
              <Fragment key={project.id}>
                <div className="flex border-b border-border/40 hover:bg-secondary/20">
                  <div className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 bg-card/90 px-2 py-2 backdrop-blur" style={{ width: LABEL_WIDTH }}>
                    <button
                      type="button"
                      onClick={() => toggle(project.id)}
                      disabled={phases.length === 0}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? t('collapse', { name: project.name }) : t('expand', { name: project.name })}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      {isOpen ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
                    </button>
                    <Link to={`/projects/${project.id}`} className="min-w-0 hover:text-primary">
                      <span className="block truncate text-[12.5px] font-medium">{project.name}</span>
                      <span className="block truncate text-[10.5px] text-muted-foreground">{project.current_phase?.name ?? t('noPhase')}</span>
                    </Link>
                  </div>
                  <div className="relative h-14" style={{ width }}>
                    {project.start_date || project.end_date ? (
                      <Bar
                        start={project.start_date}
                        end={project.end_date}
                        status={project.status}
                        range={range}
                        dayWidth={dayWidth}
                        label={project.name}
                        caption={project.current_phase?.name}
                        progress={project.progress}
                      />
                    ) : (
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] text-muted-foreground">{t('noDates')}</span>
                    )}
                  </div>
                </div>
                {isOpen
                  ? phases.map((phase) => (
                      <div key={phase.id} className="flex border-b border-border/30 bg-secondary/10">
                        <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 bg-card/90 py-1.5 pr-2 pl-10 backdrop-blur" style={{ width: LABEL_WIDTH }}>
                          <span className="truncate text-[11.5px] text-muted-foreground">{phase.name}</span>
                          <StatusPill status={phase.status} className="ml-auto h-5 px-2 text-[10px]" />
                        </div>
                        <div className="relative h-10" style={{ width }}>
                          <Bar start={phase.start_date} end={phase.end_date} status={phase.status} range={range} dayWidth={dayWidth} label={phase.name} thin />
                        </div>
                      </div>
                    ))
                  : null}
              </Fragment>
            )
          })}

          {showToday ? (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.6)]"
              style={{ left: LABEL_WIDTH + todayOffset * dayWidth + dayWidth / 2 }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
