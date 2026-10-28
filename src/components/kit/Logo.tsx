import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'

/** Mark: two concentric circles, a vertical line, a slightly tilted horizontal line, a centre dot. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/60 bg-gradient-to-br from-[#0d2b33] to-[#050b10] shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)]',
        className,
      )}
    >
      <svg viewBox="0 0 64 64" className="size-7" aria-hidden>
        <g fill="none" stroke="#49f5db" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="32" cy="32" r="21" />
          <circle cx="32" cy="32" r="12" strokeOpacity=".7" />
          <path d="M32 7v50" />
          <path d="M8 35.8 56 28.2" />
        </g>
        <circle cx="32" cy="32" r="3.4" fill="#49f5db" />
      </svg>
    </span>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center gap-3', className)} aria-label={t('brand.name')}>
      <LogoMark />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-light tracking-[0.4em] uppercase">{t('brand.wordmarkTop')}</span>
          <span className="mt-1 font-mono text-[9px] tracking-[0.5em] text-primary uppercase">{t('brand.wordmarkBottom')}</span>
        </span>
      )}
    </span>
  )
}
