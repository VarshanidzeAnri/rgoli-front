import { forwardRef, type ReactNode } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/cn'

import { useFieldControl } from './fieldContext'

export interface Option<V extends string | number = string> {
  value: V
  label: ReactNode
  /** Small leading element (dot, pill, avatar). */
  icon?: ReactNode
  disabled?: boolean
}

const EMPTY = '__empty__'

/**
 * Themed single select from an options list (replaces <select>). Radix Select can't hold "",
 * so an optional empty choice uses a sentinel internally and comes back as `null`.
 */
export const OptionSelect = forwardRef<
  HTMLButtonElement,
  {
    value: string | number | null | undefined
    onChange: (value: string | null) => void
    options: Option<string | number>[]
    placeholder?: string
    /** Adds a first option meaning "none / all"; selecting it returns null. */
    emptyLabel?: string
    disabled?: boolean
    className?: string
    'aria-label'?: string
    id?: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }
>(function OptionSelect({ value, onChange, options, placeholder, emptyLabel, disabled, className, ...aria }, ref) {
  const controlProps = useFieldControl(aria)
  const current = value === null || value === undefined || value === '' ? (emptyLabel ? EMPTY : undefined) : String(value)
  return (
    <Select value={current} onValueChange={(v) => onChange(v === EMPTY ? null : v)} disabled={disabled}>
      <SelectTrigger ref={ref} className={cn(className)} {...controlProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel ? <SelectItem value={EMPTY}>{emptyLabel}</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)} disabled={o.disabled}>
            <span className="flex items-center gap-2">
              {o.icon}
              {o.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
