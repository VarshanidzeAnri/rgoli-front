import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { toast } from 'sonner'

import i18n from '@/i18n'
import type { ApiErrorBody } from '@/types/api'

import { sessionExpired } from './authSlice'
import { API_BASE, apiHeaders } from './http'
import type { RootState } from './index'

/** Normalised error returned by every endpoint. `fieldErrors` feeds react-hook-form on 422. */
export interface ApiQueryError {
  status: number | 'FETCH_ERROR' | 'PARSING_ERROR' | 'TIMEOUT_ERROR' | 'CUSTOM_ERROR'
  message: string
  fieldErrors: Record<string, string>
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState
    return apiHeaders(state.auth.token, state.ui.locale, headers)
  },
})

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value
}

function normalise(error: FetchBaseQueryError): ApiQueryError {
  const body = 'data' in error && isErrorBody(error.data) ? error.data : null
  const fieldErrors = Object.fromEntries(Object.entries(body?.errors ?? {}).map(([k, v]) => [k, v[0] ?? '']))
  const status = typeof error.status === 'number' ? error.status : error.status
  const message = body?.message ?? ('error' in error ? error.error : i18n.t('common:errors.generic'))
  return { status, message, fieldErrors }
}

/**
 * 401 → clear the session (RequireAuth redirects to /login),
 * 403 → "no access" toast, 422 → field errors for forms,
 * network/5xx → generic error toast.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra)
  if (!result.error) return { data: result.data, meta: result.meta }

  const error = normalise(result.error)
  if (error.status === 401) {
    api.dispatch(sessionExpired())
  } else if (error.status === 403) {
    toast.error(i18n.t('common:noAccess'))
  } else if (error.status === 'FETCH_ERROR' || (typeof error.status === 'number' && error.status >= 500)) {
    toast.error(i18n.t('common:errors.server'))
  }
  return { error, meta: result.meta }
}

export const TAG_TYPES = [
  'Project',
  'Phase',
  'Issue',
  'Sprint',
  'File',
  'ClientPayment',
  'SalaryRequest',
  'User',
  'Role',
  'Activity',
  'Notification',
  'Report',
  'Dashboard',
  'Comment',
] as const

/** Single API slice; features add endpoints with `api.injectEndpoints`. */
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: TAG_TYPES,
  refetchOnReconnect: true,
  endpoints: () => ({}),
})

export function isApiError(value: unknown): value is ApiQueryError {
  return typeof value === 'object' && value !== null && 'status' in value && 'fieldErrors' in value
}
