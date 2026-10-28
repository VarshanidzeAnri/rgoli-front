import { toast } from 'sonner'

import i18n from '@/i18n'
import type { PaymentMethod, PaymentStatus } from '@/lib/enums'
import { api } from '@/store/api'
import type { ClientPayment, DataResponse, FinanceSummary, Paginated, SalaryRequest } from '@/types/api'

export interface FinanceListParams {
  project_id?: number | null
  status?: PaymentStatus | ''
  user_id?: number | null
  from?: string
  to?: string
  page?: number
}

export interface PaymentInput {
  amount: string
  paid_at: string
  method: PaymentMethod
  note?: string | null
}

export interface SalaryInput {
  project_id: number
  title: string
  amount: string
  note?: string | null
}

function params(p: FinanceListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== '') out[k] = v as string | number
  return out
}

const AFTER_MONEY = ['Dashboard' as const, 'Report' as const, { type: 'Project' as const, id: 'LIST' }]

export const financeApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFinanceSummary: build.query<FinanceSummary, void>({
      query: () => '/finance/summary',
      transformResponse: (r: DataResponse<FinanceSummary>) => r.data,
      providesTags: ['ClientPayment', 'SalaryRequest'],
    }),

    // ── Client payments ────────────────────────────────────────────────
    getPayments: build.query<Paginated<ClientPayment>, FinanceListParams | void>({
      query: (p) => ({ url: '/client-payments', params: params(p ?? {}) }),
      providesTags: ['ClientPayment'],
    }),
    getProjectPayments: build.query<Paginated<ClientPayment>, number>({
      query: (projectId) => `/projects/${projectId}/payments`,
      providesTags: ['ClientPayment'],
    }),
    createPayment: build.mutation<ClientPayment, { projectId: number } & PaymentInput>({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/payments`, method: 'POST', body }),
      transformResponse: (r: DataResponse<ClientPayment>) => r.data,
      invalidatesTags: (_r, _e, { projectId }) => ['ClientPayment', { type: 'Project', id: projectId }, ...AFTER_MONEY],
    }),
    updatePayment: build.mutation<ClientPayment, { id: number; projectId: number } & Partial<PaymentInput>>({
      query: ({ id, projectId: _p, ...body }) => ({ url: `/client-payments/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<ClientPayment>) => r.data,
      invalidatesTags: (_r, _e, { projectId }) => ['ClientPayment', { type: 'Project', id: projectId }, ...AFTER_MONEY],
    }),
    deletePayment: build.mutation<void, { id: number; projectId: number }>({
      query: ({ id }) => ({ url: `/client-payments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { projectId }) => ['ClientPayment', { type: 'Project', id: projectId }, ...AFTER_MONEY],
    }),

    // ── Salary requests ────────────────────────────────────────────────
    getSalaryRequests: build.query<Paginated<SalaryRequest>, FinanceListParams | void>({
      query: (p) => ({ url: '/salary-requests', params: params(p ?? {}) }),
      providesTags: ['SalaryRequest'],
    }),
    createSalaryRequest: build.mutation<SalaryRequest, SalaryInput>({
      query: (body) => ({ url: '/salary-requests', method: 'POST', body }),
      transformResponse: (r: DataResponse<SalaryRequest>) => r.data,
      invalidatesTags: ['SalaryRequest', 'Dashboard'],
    }),
    updateSalaryRequest: build.mutation<SalaryRequest, { id: number } & Partial<Omit<SalaryInput, 'project_id'>>>({
      query: ({ id, ...body }) => ({ url: `/salary-requests/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<SalaryRequest>) => r.data,
      invalidatesTags: ['SalaryRequest'],
    }),
    deleteSalaryRequest: build.mutation<void, number>({
      query: (id) => ({ url: `/salary-requests/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SalaryRequest', 'Dashboard'],
    }),
    /** Approve/reject with an optimistic status change in every cached list. */
    decideSalaryRequest: build.mutation<SalaryRequest, { id: number; decision: 'approve' | 'reject'; note?: string | null }>({
      query: ({ id, decision, note }) => ({ url: `/salary-requests/${id}/${decision}`, method: 'POST', body: { note: note ?? null } }),
      transformResponse: (r: DataResponse<SalaryRequest>) => r.data,
      async onQueryStarted({ id, decision }, lifecycle) {
        const { dispatch, queryFulfilled } = lifecycle
        const status: PaymentStatus = decision === 'approve' ? 'approved' : 'rejected'
        const patches = financeApi.util
          .selectInvalidatedBy(lifecycle.getState(), ['SalaryRequest'])
          .filter((e) => e.endpointName === 'getSalaryRequests')
          .map((e) =>
            dispatch(
              financeApi.util.updateQueryData('getSalaryRequests', e.originalArgs as FinanceListParams | undefined, (draft) => {
                const row = draft.data.find((r) => r.id === id)
                if (row) {
                  row.status = status
                  row.can.decide = false
                  row.can.update = false
                }
              }),
            ),
          )
        try {
          await queryFulfilled
          toast.success(i18n.t(decision === 'approve' ? 'finance:salary.approvedToast' : 'finance:salary.rejectedToast'))
        } catch {
          patches.forEach((p) => p.undo())
          toast.error(i18n.t('common:errors.generic'))
        }
      },
      invalidatesTags: ['SalaryRequest', 'Dashboard', 'Report', { type: 'Notification', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetFinanceSummaryQuery,
  useGetPaymentsQuery,
  useGetProjectPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetSalaryRequestsQuery,
  useCreateSalaryRequestMutation,
  useUpdateSalaryRequestMutation,
  useDeleteSalaryRequestMutation,
  useDecideSalaryRequestMutation,
} = financeApi
