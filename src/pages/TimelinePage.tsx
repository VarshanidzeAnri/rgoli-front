import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState, PageHero, Panel, Pill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { useGetTimelineQuery } from '@/features/projects/api'
import { buildRange, Gantt, rangeParams, shiftAnchor, ZOOM_CONFIG, type Zoom } from '@/features/timeline'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'

export default function TimelinePage() {
  const { t } = useTranslation(['timeline', 'nav', 'common'])
  const f = useFormat()
  const [zoom, setZoom] = useState<Zoom>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const range = useMemo(() => buildRange(anchor, zoom), [anchor, zoom])
  const { data, isLoading, isError, refetch } = useGetTimelineQuery(rangeParams(range))

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('nav:timeline')}
        subtitle={t('subtitle')}
        meta={<Pill tone="primary">{t('range', { from: f.date(range.from), to: f.date(range.to) })}</Pill>}
        actions={
          <>
            <div role="radiogroup" aria-label={t('zoom.label')} className="flex rounded-full border border-border/70 bg-secondary/30 p-0.5">
              {(['month', 'quarter'] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  role="radio"
                  aria-checked={zoom === z}
                  onClick={() => setZoom(z)}
                  className={cn('h-8 rounded-full px-3.5 text-xs transition', zoom === z ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}
                >
                  {t(`zoom.${z}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Button size="icon" onClick={() => setAnchor((a) => shiftAnchor(a, zoom, -1))} aria-label={t('common:actions.previous')}>
                <ChevronLeftIcon />
              </Button>
              <Button onClick={() => setAnchor(new Date())}>{t('common:actions.today')}</Button>
              <Button size="icon" onClick={() => setAnchor((a) => shiftAnchor(a, zoom, 1))} aria-label={t('common:actions.next')}>
                <ChevronRightIcon />
              </Button>
            </div>
          </>
        }
      />
      <Panel bodyClassName="p-0">
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-2 p-5" aria-busy>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Gantt projects={data} range={range} dayWidth={ZOOM_CONFIG[zoom].dayWidth} />
        )}
      </Panel>
    </div>
  )
}
