import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { downloadAuthorized, fetchAuthorizedBlob } from '@/lib/download'
import { useAppSelector } from '@/store'
import { selectToken } from '@/store/authSlice'
import { selectLocale } from '@/store/uiSlice'

/** Object URL for an authorized image (e.g. file preview). Revoked on unmount. */
export function useAuthorizedObjectUrl(url: string | null | undefined): string | null {
  const token = useAppSelector(selectToken)
  const locale = useAppSelector(selectLocale)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let revoked = false
    let created: string | null = null
    fetchAuthorizedBlob(url, token, locale)
      .then(({ blob }) => {
        if (revoked) return
        created = URL.createObjectURL(blob)
        setObjectUrl(created)
      })
      .catch(() => setObjectUrl(null))
    return () => {
      revoked = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [url, token, locale])

  return url ? objectUrl : null
}

/** Returns a function that downloads an authorized URL, with an error toast. */
export function useAuthorizedDownload() {
  const token = useAppSelector(selectToken)
  const locale = useAppSelector(selectLocale)
  const { t } = useTranslation()
  return useCallback(
    async (url: string, fallbackName: string) => {
      try {
        await downloadAuthorized(url, token, locale, fallbackName)
      } catch {
        toast.error(t('errors.generic'))
      }
    },
    [token, locale, t],
  )
}
