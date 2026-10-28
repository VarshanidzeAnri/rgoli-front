import { api } from '@/store/api'
import { API_BASE } from '@/store/http'
import type { DataResponse, ReportSummary } from '@/types/api'

export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReportSummary: build.query<ReportSummary, { from?: string; to?: string } | void>({
      query: (range) => ({
        url: '/reports/summary',
        params: Object.fromEntries(Object.entries(range ?? {}).filter(([, v]) => Boolean(v))),
      }),
      transformResponse: (r: DataResponse<ReportSummary>) => r.data,
      providesTags: ['Report'],
    }),
  }),
})

export const { useGetReportSummaryQuery } = reportsApi

/** CSV export URL; download it with useAuthorizedDownload (needs the Bearer token). */
export function reportExportUrl(type: 'tasks' | 'projects'): string {
  return `${API_BASE}/reports/export?type=${type}`
}
