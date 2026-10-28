import { useId, type ReactElement, type ReactNode, cloneElement, isValidElement } from 'react'

import { Label } from '@/components/ui/misc'
import { cn } from '@/lib/cn'

/**
 * Form field: mono uppercase label above, control, hint or error below.
 * Wires id / aria-invalid / aria-describedby onto the single child control.
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
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string | undefined) ?? id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={(children.props.id as string | undefined) ?? id}>{label}</Label>
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
  )
}
