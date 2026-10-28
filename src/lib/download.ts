import { apiHeaders } from '@/store/http'
import type { Locale } from './enums'

function fileNameFrom(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1]
  if (utf8) return decodeURIComponent(utf8)
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallback
}

/** Fetches an authorized URL (Bearer token) as a Blob. */
export async function fetchAuthorizedBlob(url: string, token: string | null, locale: Locale): Promise<{ blob: Blob; fileName: string | null }> {
  const response = await fetch(url, { headers: apiHeaders(token, locale) })
  if (!response.ok) throw new Error(String(response.status))
  return { blob: await response.blob(), fileName: response.headers.get('Content-Disposition') }
}

/** Downloads an authorized file and saves it with the server-provided name. */
export async function downloadAuthorized(url: string, token: string | null, locale: Locale, fallbackName: string): Promise<void> {
  const { blob, fileName } = await fetchAuthorizedBlob(url, token, locale)
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileNameFrom(fileName, fallbackName)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
