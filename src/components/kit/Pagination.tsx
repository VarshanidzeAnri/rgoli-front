import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@/types/api'

export function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
  const { t } = useTranslation()
  if (meta.last_page <= 1) return null
  return (
    <nav aria-label={t('pagination.label')} className="flex items-center justify-between gap-3 pt-4">
      <p className="num text-[11px] text-muted-foreground">
        {t('pagination.summary', { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total })}
      </p>
      <div className="flex gap-1.5">
        <Button size="icon-sm" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} aria-label={t('actions.previous')}>
          <ChevronLeftIcon />
        </Button>
        <Button
          size="icon-sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
          aria-label={t('actions.next')}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
