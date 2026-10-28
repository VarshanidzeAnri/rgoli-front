import { api } from '@/store/api'
import type { DataResponse, Sprint } from '@/types/api'

export interface SprintInput {
  name: string
  goal?: string | null
  start_date: string
  end_date: string
}

const SPRINTS = 'Sprint' as const
const AFTER_CHANGE = [SPRINTS, { type: 'Issue' as const, id: 'LIST' }, 'Dashboard' as const]

export const sprintsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSprints: build.query<Sprint[], void>({
      query: () => '/sprints',
      transformResponse: (r: DataResponse<Sprint[]>) => r.data,
      providesTags: [SPRINTS],
    }),
    createSprint: build.mutation<Sprint, SprintInput>({
      query: (body) => ({ url: '/sprints', method: 'POST', body }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: [SPRINTS],
    }),
    updateSprint: build.mutation<Sprint, { id: number } & Partial<SprintInput>>({
      query: ({ id, ...body }) => ({ url: `/sprints/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: [SPRINTS],
    }),
    deleteSprint: build.mutation<void, number>({
      query: (id) => ({ url: `/sprints/${id}`, method: 'DELETE' }),
      invalidatesTags: AFTER_CHANGE,
    }),
    startSprint: build.mutation<Sprint, number>({
      query: (id) => ({ url: `/sprints/${id}/start`, method: 'POST' }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: AFTER_CHANGE,
    }),
    completeSprint: build.mutation<Sprint, { id: number; move_open_to: number | null }>({
      query: ({ id, move_open_to }) => ({ url: `/sprints/${id}/complete`, method: 'POST', body: { move_open_to } }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: AFTER_CHANGE,
    }),
    addIssuesToSprint: build.mutation<Sprint, { id: number; issue_ids: number[] }>({
      query: ({ id, issue_ids }) => ({ url: `/sprints/${id}/issues`, method: 'POST', body: { issue_ids } }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: AFTER_CHANGE,
    }),
    removeIssueFromSprint: build.mutation<Sprint, { id: number; issueId: number }>({
      query: ({ id, issueId }) => ({ url: `/sprints/${id}/issues/${issueId}`, method: 'DELETE' }),
      transformResponse: (r: DataResponse<Sprint>) => r.data,
      invalidatesTags: AFTER_CHANGE,
    }),
  }),
})

export const {
  useGetSprintsQuery,
  useCreateSprintMutation,
  useUpdateSprintMutation,
  useDeleteSprintMutation,
  useStartSprintMutation,
  useCompleteSprintMutation,
  useAddIssuesToSprintMutation,
  useRemoveIssueFromSprintMutation,
} = sprintsApi
