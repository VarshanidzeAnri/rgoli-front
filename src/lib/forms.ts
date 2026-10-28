import { useCallback } from 'react'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type kaValidation from '@/i18n/locales/ka/validation.json'
import { isApiError } from '@/store/api'

type ValidationKey = keyof typeof kaValidation

/**
 * zod schemas put an i18n key in the message, e.g. z.string().min(1, 'validation:required').
 * This turns it into text in the current language (with optional interpolation values).
 */
export function useFieldError() {
  const { t } = useTranslation('validation')
  return useCallback(
    (message: string | undefined, values: Record<string, string | number> = {}): string | undefined => {
      if (!message) return undefined
      if (!message.startsWith('validation:')) return message // server messages are already translated
      const key = message.slice('validation:'.length) as ValidationKey
      return t(key, values)
    },
    [t],
  )
}

/**
 * Maps a 422 response onto react-hook-form fields. Returns true when field errors were applied;
 * otherwise shows the server message as a toast.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (!isApiError(error)) return false
  const entries = Object.entries(error.fieldErrors)
  if (error.status === 422 && entries.length > 0) {
    for (const [field, message] of entries) setError(field.split('.')[0] as Path<T>, { type: 'server', message })
    return true
  }
  if (error.status !== 403 && error.status !== 401) toast.error(error.message)
  return false
}

/** Empty string → null for optional API fields. */
export function nullable(value: string | null | undefined): string | null {
  return value === undefined || value === null || value.trim() === '' ? null : value.trim()
}
