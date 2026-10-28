import { cn } from '@/lib/cn'

const FILL = {
  primary: 'from-primary to-info',
  success: 'from-success to-primary',
  warning: 'from-warning to-danger',
} as const

/** 6px progress bar with a gradient fill. */
export function ProgressBar({
  value,
  variant = 'primary',
  label,
  className,
}: {
  value: number
  variant?: keyof typeof FILL
  label?: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <div className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', FILL[variant])} style={{ width: `${clamped}%` }} />
    </div>
  )
}
