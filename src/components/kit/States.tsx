import { AlertTriangleIcon, InboxIcon, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  text,
  action,
  className,
}: {
  icon?: LucideIcon
  title?: ReactNode
  text?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-border bg-secondary/40 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium">{title ?? t('empty.title')}</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{text ?? t('empty.text')}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry, className }: { message?: ReactNode; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-5" aria-hidden />
      </span>
      <p className="text-sm">{message ?? t('errors.generic')}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      ) : null}
    </div>
  )
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-col gap-2.5', className)} aria-busy aria-label={t('loading')}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  )
}

export function CardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)} aria-busy aria-label={t('loading')}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-[22px]" />
      ))}
    </div>
  )
}
