import { type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Glass panel: rounded 26px, hairline border, blurred card background. */
export function Panel({
  title,
  eyebrow,
  actions,
  className,
  bodyClassName,
  children,
  ...props
}: Omit<ComponentProps<'section'>, 'title'> & {
  title?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  bodyClassName?: string
}) {
  return (
    <section className={cn('glass flex min-w-0 flex-col', className)} {...props}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div className="min-w-0">
            {eyebrow ? <p className="micro-label mb-0.5">{eyebrow}</p> : null}
            {title ? <h2 className="truncate text-sm font-semibold">{title}</h2> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('min-w-0 flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
