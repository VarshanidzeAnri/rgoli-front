import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

import { Label } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

import { FieldContext } from './fieldContext'

/**
 * Form field: label above, control, hint or error below.
 * Native inputs get id/aria props directly; custom controls (DatePicker, OptionSelect, Combobox)
 * read them from FieldContext, so they also work inside a react-hook-form <Controller>.
 */
export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode
  error?: string | undefined
  hint?: ReactNode
  className?: string
  children: ReactElement<Record<string, unknown>>
}) {
  const generated = useId()
  const ownId = isValidElement(children) ? (children.props.id as string | undefined) : undefined
  const id = ownId ?? generated
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const controlProps = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy }

  // Native elements get the props directly; components (Input, DatePicker, …) read FieldContext.
  const control = isValidElement(children) && ['input', 'select', 'textarea'].includes(String(children.type)) ? cloneElement(children, controlProps) : children

  return (
    <FieldContext.Provider value={controlProps}>
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <Label htmlFor={id}>{label}</Label>
        {control}
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-[11.5px] text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-[11.5px] text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  )
}
