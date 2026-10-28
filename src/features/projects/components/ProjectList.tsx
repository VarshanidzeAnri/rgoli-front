import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { AvatarStack, DisciplinePill, ProgressBar, StatusPill } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { isOverdue } from '@/lib/format'
import type { Project } from '@/types/api'

function Deadline({ project }: { project: Project }) {
  const f = useFormat()
  if (!project.end_date) return <span className="text-muted-foreground">—</span>
  const late = project.status !== 'done' && isOverdue(project.end_date)
  return (
    <time dateTime={project.end_date} className={cn('num text-[12px]', late && 'text-danger')}>
      {f.date(project.end_date)}
    </time>
  )
}

/** Table on md+ screens. */
export function ProjectTable({ projects }: { projects: Project[] }) {
  const { t } = useTranslation('projects')
  const f = useFormat()
  const showBudget = projects.some((p) => p.finance !== null)

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[860px] border-separate border-spacing-y-1.5 text-left">
        <thead>
          <tr className="micro-label">
            <th scope="col" className="px-4 py-2 font-normal">{t('columns.project')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.discipline')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.status')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.phase')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.progress')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.deadline')}</th>
            <th scope="col" className="px-3 py-2 font-normal">{t('columns.members')}</th>
            {showBudget ? <th scope="col" className="px-4 py-2 text-right font-normal">{t('columns.budget')}</th> : null}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              className="relative bg-secondary/20 transition hover:bg-secondary/45 [&>td]:border-y [&>td]:border-border/40 [&>td:first-child]:rounded-l-2xl [&>td:first-child]:border-l [&>td:last-child]:rounded-r-2xl [&>td:last-child]:border-r"
            >
              <td className="max-w-[18rem] px-4 py-3">
                <Link
                  to={`/projects/${p.id}`}
                  className="block truncate text-[13px] font-medium after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-primary"
                >
                  {p.name}
                </Link>
                <span className="block truncate text-[11px] text-muted-foreground">
                  <span className="num">{p.key}</span> · {p.client_name}
                </span>
              </td>
              <td className="px-3 py-3">
                <DisciplinePill discipline={p.discipline} />
              </td>
              <td className="px-3 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="max-w-[14rem] truncate px-3 py-3 text-[12px] text-muted-foreground">{p.current_phase?.name ?? t('noPhase')}</td>
              <td className="w-36 px-3 py-3">
                <span className="flex items-center gap-2">
                  <ProgressBar value={p.progress} label={t('columns.progress')} />
                  <span className="num w-9 text-right text-[11px] text-muted-foreground">{p.progress}%</span>
                </span>
              </td>
              <td className="px-3 py-3">
                <Deadline project={p} />
              </td>
              <td className="px-3 py-3">{p.members ? <AvatarStack users={p.members} size="xs" /> : null}</td>
              {showBudget ? (
                <td className="num px-4 py-3 text-right text-[12.5px]">{p.finance ? f.money(p.finance.agreed_price) : '—'}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Cards below md. */
export function ProjectCards({ projects }: { projects: Project[] }) {
  const { t } = useTranslation('projects')
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {projects.map((p) => (
        <li key={p.id}>
          <Link to={`/projects/${p.id}`} className="block rounded-2xl border border-border/50 bg-secondary/20 p-4 transition hover:border-primary/40">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{p.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  <span className="num">{p.key}</span> · {p.client_name}
                </span>
              </span>
              <StatusPill status={p.status} />
            </span>
            <span className="mt-3 flex flex-wrap items-center gap-2">
              <DisciplinePill discipline={p.discipline} />
              <span className="truncate text-[11px] text-muted-foreground">{p.current_phase?.name ?? t('noPhase')}</span>
            </span>
            <span className="mt-3 flex items-center gap-2">
              <ProgressBar value={p.progress} label={t('columns.progress')} />
              <span className="num text-[11px] text-muted-foreground">{p.progress}%</span>
            </span>
            <span className="mt-3 flex items-center justify-between">
              <Deadline project={p} />
              {p.members ? <AvatarStack users={p.members} size="xs" /> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
