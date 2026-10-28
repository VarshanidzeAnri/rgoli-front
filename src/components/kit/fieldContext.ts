import { createContext, useContext } from 'react'

type AriaInvalid = boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined

export interface FieldControlProps {
  id: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * <Field> provides id/aria wiring through context so custom controls (DatePicker, OptionSelect,
 * Combobox) stay linked to their label even when wrapped in a react-hook-form <Controller>.
 */
export const FieldContext = createContext<FieldControlProps | null>(null)

/** Merges explicit props over the surrounding Field's id/aria props. */
export function useFieldControl<T extends { id?: string; 'aria-invalid'?: AriaInvalid; 'aria-describedby'?: string }>(props: T): T {
  const field = useContext(FieldContext)
  return {
    ...props,
    id: props.id ?? field?.id,
    'aria-invalid': props['aria-invalid'] ?? field?.['aria-invalid'],
    'aria-describedby': props['aria-describedby'] ?? field?.['aria-describedby'],
  }
}
