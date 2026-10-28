import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/enums'

import { TONE_CLASS } from '@/lib/tones'

/** KPI card: hairline gradient on top, glow blob, eyebrow, toned icon tile, 22px mono value, hint, footer. */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  footer,
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  tone?: Tone
  footer?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px] border border-border/70 bg-card/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-2xl sm:p-5',
        className,
      )}
    >
      <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-12 -right-10 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="micro-label leading-snug">{label}</p>
        <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-xl border', TONE_CLASS[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="num relative mt-3 text-[22px] leading-none font-semibold">{value}</p>
      {hint ? <p className="relative mt-2 text-[11.5px] text-muted-foreground">{hint}</p> : null}
      {footer ? <div className="relative mt-3">{footer}</div> : null}
    </div>
  )
}
