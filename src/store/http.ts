import type { ApiErrorBody } from '@/types/api'
import type { Locale } from '@/lib/enums'

/** API root, e.g. "https://api.rgoli.ge/api/v1" (or "/api/v1" behind the Vite proxy). */
export const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/v1`

/** Headers sent on every request: JSON, Bearer token, current UI language. */
export function apiHeaders(token: string | null, locale: Locale, headers: Headers = new Headers()): Headers {
  headers.set('Accept', 'application/json')
  headers.set('Accept-Language', locale)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.body.errors ?? {}).map(([field, messages]) => [field, messages[0] ?? '']))
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string'
}

/** Small fetch wrapper for auth thunks (RTK Query has its own baseQuery). */
export async function request<T>(
  path: string,
  { method = 'GET', body, token, locale }: { method?: string; body?: unknown; token: string | null; locale: Locale },
): Promise<T> {
  const headers = apiHeaders(token, locale)
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T

  const json: unknown = await response.json().catch(() => ({ message: response.statusText }))
  if (!response.ok) {
    throw new ApiError(response.status, isErrorBody(json) ? json : { message: response.statusText })
  }
  return json as T
}
