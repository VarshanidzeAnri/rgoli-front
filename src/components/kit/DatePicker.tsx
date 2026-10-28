import { CalendarIcon, XIcon } from 'lucide-react'
import { forwardRef, useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

import { Calendar } from '@/components/ui/calendar'
import { inputClass } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { parseDate, toIsoDate } from '@/lib/format'

import { useFieldControl } from './fieldContext'

export interface DatePickerProps extends Omit<ComponentProps<'button'>, 'value' | 'onChange'> {
  /** "YYYY-MM-DD" or null/empty. */
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  /** Show a clear (×) button when a date is set. */
  clearable?: boolean
  /** Dates before this "YYYY-MM-DD" are disabled. */
  min?: string | null
}

/**
 * Date field with a themed popover calendar (replaces <input type="date">).
 * Use with react-hook-form through <Controller> or `value`/`onChange`.
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  { value, onChange, placeholder, clearable = true, min, className, disabled, ...props },
  ref,
) {
  const { t } = useTranslation()
  const f = useFormat()
  const [open, setOpen] = useState(false)
  const controlProps = useFieldControl(props)
  const selected = value ? parseDate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(inputClass, 'items-center gap-2 text-left', !value && 'text-muted-foreground/70', className)}
            {...controlProps}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="num truncate">{value ? f.date(value) : (placeholder ?? t('datePicker.placeholder'))}</span>
          </button>
        </PopoverTrigger>
        {clearable && value && !disabled ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t('actions.clear')}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={min ? { before: parseDate(min) } : undefined}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : null)
            setOpen(false)
          }}
        />
        <div className="mt-1 flex justify-between border-t border-border/60 px-1 pt-2">
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { onChange(null); setOpen(false) }}>
            {t('actions.clear')}
          </button>
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => { onChange(toIsoDate(new Date())); setOpen(false) }}>
            {t('actions.today')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
})
