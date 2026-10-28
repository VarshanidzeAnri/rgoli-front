import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import { STATUS_TONE, STATUSES } from '@/lib/enums'
import { TONE_DOT } from '@/lib/tones'
import type { StatusCounts } from '@/types/api'

/** Horizontal stacked bar of project counts per status, with a legend. */
export function StatusDistribution({ counts }: { counts: StatusCounts }) {
  const { t } = useTranslation(['dashboard', 'enums'])
  const total = STATUSES.reduce((sum, s) => sum + counts[s], 0)

  return (
    <div>
      <p className="micro-label mb-2">{t('projects.distribution')}</p>
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={STATUSES.map((s) => `${t(`enums:status.${s}`)}: ${counts[s]}`).join(', ')}
      >
        {total > 0
          ? STATUSES.filter((s) => counts[s] > 0).map((s) => (
              <span key={s} className={cn('h-full', TONE_DOT[STATUS_TONE[s]])} style={{ width: `${(counts[s] / total) * 100}%` }} />
            ))
          : null}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span aria-hidden className={cn('size-2 rounded-full', TONE_DOT[STATUS_TONE[s]])} />
            {t(`enums:status.${s}`)}
            <span className="num text-foreground">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
