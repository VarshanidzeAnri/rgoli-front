import { useTranslation } from 'react-i18next'

import { ProgressBar, UserAvatar } from '@/components/kit'
import { cn } from '@/lib/cn'
import type { WorkloadRow } from '@/types/api'

/** Workload above this percentage is shown in the warning tone. */
export const WORKLOAD_WARNING = 60

export function WorkloadList({ rows }: { rows: WorkloadRow[] }) {
  const { t } = useTranslation('dashboard')
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const high = row.load_percent > WORKLOAD_WARNING
        return (
          <li key={row.user.id} className="flex items-center gap-3">
            <UserAvatar user={row.user} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px]">{row.user.name}</span>
                <span className={cn('num text-[11px]', high ? 'text-warning' : 'text-muted-foreground')}>
                  {t('workload.load', { value: row.load_percent })}
                </span>
              </div>
              <ProgressBar
                value={row.load_percent}
                variant={high ? 'warning' : 'primary'}
                label={t('workload.loadLabel', { name: row.user.name })}
                className="mt-1.5"
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">{t('workload.openTasks', { count: row.open_count })}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
