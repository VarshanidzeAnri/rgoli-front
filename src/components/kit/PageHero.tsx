import { type ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Page header card: eyebrow with a 24px line, title, subtitle, meta pills, actions. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-card/80 via-card/50 to-background/40 p-6 shadow-[var(--shadow-panel)] backdrop-blur-2xl sm:p-7',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -top-10 right-10 size-56 rounded-full border border-primary/15" />
      <div aria-hidden className="pointer-events-none absolute top-6 right-32 size-28 rounded-full border border-primary/10" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="micro-label flex items-center gap-2.5 text-primary">
              <span aria-hidden className="h-px w-6 bg-primary" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
          {subtitle ? <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">{subtitle}</p> : null}
          {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div> : null}
      </div>
    </section>
  )
}
