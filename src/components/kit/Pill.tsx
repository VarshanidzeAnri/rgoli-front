import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import { TONE_CLASS, TONE_DOT } from '@/lib/tones'
import {
  DISCIPLINE_TONE,
  PAYMENT_TONE,
  PRIORITY_TONE,
  STATUS_TONE,
  type Discipline,
  type PaymentStatus,
  type Priority,
  type Status,
  type Tone,
} from '@/lib/enums'

export function Pill({ tone = 'muted', dot = false, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] leading-none font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn('size-1.5 rounded-full', TONE_DOT[tone])} /> : null}
      {children}
    </span>
  )
}

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const { t } = useTranslation('enums')
  return (
    <Pill tone={STATUS_TONE[status]} dot className={className}>
      {t(`status.${status}`)}
    </Pill>
  )
}

export function PriorityPill({ priority, className }: { priority: Priority; className?: string }) {
  const { t } = useTranslation('enums')
  return (
    <Pill tone={PRIORITY_TONE[priority]} className={className}>
      {t(`priority.${priority}`)}
    </Pill>
  )
}

export function DisciplinePill({ discipline, className }: { discipline: Discipline; className?: string }) {
  const { t } = useTranslation('enums')
  return (
    <Pill tone={DISCIPLINE_TONE[discipline]} className={className}>
      {t(`discipline.${discipline}`)}
    </Pill>
  )
}

export function PaymentPill({ status, className }: { status: PaymentStatus; className?: string }) {
  const { t } = useTranslation('enums')
  return (
    <Pill tone={PAYMENT_TONE[status]} dot className={className}>
      {t(`payment_status.${status}`)}
    </Pill>
  )
}
