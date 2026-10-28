import { AlertTriangleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState, Panel, ProgressBar, UserAvatar } from '@/components/kit'
import { cn } from '@/lib/cn'
import type { WorkloadRow } from '@/types/api'

/** Load above this percentage is flagged. */
export const OVERLOAD_THRESHOLD = 60

export function WorkloadCards({ rows }: { rows: WorkloadRow[] }) {
  const { t } = useTranslation(['reports', 'common'])
  return (
    <Panel title={t('workload.title')}>
      {rows.length === 0 ? (
        <EmptyState title={t('workload.empty')} text="" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => {
            const high = row.load_percent > OVERLOAD_THRESHOLD
            return (
              <li
                key={row.user.id}
                className={cn('rounded-[20px] border p-4', high ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-secondary/20')}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={row.user} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{row.user.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{row.user.job_title}</p>
                  </div>
                </div>
                <p className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>{t('common:counts.tasks', { count: row.open_count })}</span>
                  <span className="num">{t('common:counts.points', { count: row.open_points })}</span>
                </p>
                <ProgressBar
                  className="mt-2"
                  value={row.load_percent}
                  variant={high ? 'warning' : 'primary'}
                  label={t('workload.load', { percent: row.load_percent })}
                />
                <p className={cn('mt-2 flex items-center gap-1.5 text-[11px]', high ? 'text-warning' : 'text-muted-foreground')}>
                  {high ? <AlertTriangleIcon className="size-3.5" aria-hidden /> : null}
                  {t('workload.load', { percent: row.load_percent })}
                  {high ? ` · ${t('workload.overloaded')}` : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
