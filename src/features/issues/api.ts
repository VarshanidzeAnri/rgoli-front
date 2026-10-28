import { toast } from 'sonner'

import i18n from '@/i18n'
import type { Priority, Status } from '@/lib/enums'
import { api } from '@/store/api'
import type { Board, Comment, DataResponse, Issue, Paginated } from '@/types/api'

export interface IssueListParams {
  project_id?: number | null
  status?: string
  priority?: Priority | ''
  assignee?: number | null
  mine?: boolean
  sprint?: number | null
  backlog?: boolean
  due_from?: string
  due_to?: string
  search?: string
  sort?: string
  page?: number
  per_page?: number
}

export interface IssueInput {
  project_id: number
  title: string
  description?: string | null
  status?: Status
  priority?: Priority
  due_date?: string | null
  points?: number
  assignee_ids?: number[]
  sprint_id?: number | null
}

export type IssueUpdate = Partial<Omit<IssueInput, 'project_id' | 'status' | 'sprint_id'>>

export function issueParams(params: IssueListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    out[k] = typeof v === 'boolean' ? 1 : (v as string | number)
  }
  return out
}

const ISSUE_LIST = { type: 'Issue' as const, id: 'LIST' }

/**
 * Moves an issue inside a cached board: removes it from its column and inserts it
 * directly below `afterId` (or at the top) in the target column.
 */
export function applyMove(board: Board, issueId: number, status: Status, afterId: number | null): void {
  let moving: Issue | undefined
  for (const column of Object.values(board)) {
    const index = column.findIndex((i) => i.id === issueId)
    if (index >= 0) {
      moving = column.splice(index, 1)[0]
      break
    }
  }
  if (!moving) return
  moving.status = status
  const target = board[status]
  const afterIndex = afterId === null ? -1 : target.findIndex((i) => i.id === afterId)
  target.splice(afterIndex + 1, 0, moving)
  target.forEach((issue, position) => {
    issue.position = position
  })
}

export const issuesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getIssues: build.query<Paginated<Issue>, IssueListParams | void>({
      query: (params) => ({ url: '/issues', params: issueParams(params ?? {}) }),
      providesTags: (result) => [ISSUE_LIST, ...(result?.data.map((i) => ({ type: 'Issue' as const, id: i.id })) ?? [])],
    }),
    getBoard: build.query<Board, IssueListParams | void>({
      query: (params) => ({ url: '/issues/board', params: issueParams(params ?? {}) }),
      transformResponse: (r: DataResponse<Board>) => r.data,
      providesTags: [ISSUE_LIST, { type: 'Issue', id: 'BOARD' }],
    }),
    getIssue: build.query<Issue, number>({
      query: (id) => `/issues/${id}`,
      transformResponse: (r: DataResponse<Issue>) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Issue', id }],
    }),
    createIssue: build.mutation<Issue, IssueInput>({
      query: (body) => ({ url: '/issues', method: 'POST', body }),
      transformResponse: (r: DataResponse<Issue>) => r.data,
      invalidatesTags: (_r, _e, { project_id }) => [ISSUE_LIST, 'Sprint', 'Dashboard', 'Report', { type: 'Project', id: project_id }],
    }),
    /** Quick edit with optimistic update of the single-issue cache. */
    updateIssue: build.mutation<Issue, { id: number } & IssueUpdate>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Issue>) => r.data,
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const undo = dispatch(
          issuesApi.util.updateQueryData('getIssue', id, (draft) => {
            const { assignee_ids: _ignored, ...fields } = patch
            Object.assign(draft, fields)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          undo.undo()
          toast.error(i18n.t('common:errors.generic'))
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Issue', id }, ISSUE_LIST, 'Sprint', 'Dashboard'],
    }),
    /** Board drag: optimistic in every cached board, rolled back with a toast on error. */
    moveIssue: build.mutation<Issue, { id: number; status: Status; after_id: number | null }>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}/move`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Issue>) => r.data,
      async onQueryStarted({ id, status, after_id }, lifecycle) {
        const { dispatch, queryFulfilled } = lifecycle
        const patches = issuesApi.util
          .selectInvalidatedBy(lifecycle.getState(), [{ type: 'Issue', id: 'BOARD' }])
          .filter((entry) => entry.endpointName === 'getBoard')
          .map((entry) =>
            dispatch(
              issuesApi.util.updateQueryData('getBoard', entry.originalArgs as IssueListParams | undefined, (draft) => {
                applyMove(draft, id, status, after_id)
              }),
            ),
          )
        try {
          await queryFulfilled
          toast.success(i18n.t('board:moved'))
        } catch {
          patches.forEach((p) => p.undo())
          toast.error(i18n.t('board:moveFailed'))
        }
      },
      invalidatesTags: (_r, error, { id }) =>
        error ? [{ type: 'Issue', id: 'BOARD' }] : [{ type: 'Issue', id }, 'Sprint', 'Dashboard', 'Report', { type: 'Activity', id: 'LIST' }],
    }),
    deleteIssue: build.mutation<void, number>({
      query: (id) => ({ url: `/issues/${id}`, method: 'DELETE' }),
      invalidatesTags: [ISSUE_LIST, 'Sprint', 'Dashboard', 'Report'],
    }),

    // ── Comments ───────────────────────────────────────────────────────
    getComments: build.query<Paginated<Comment>, number>({
      query: (issueId) => `/issues/${issueId}/comments`,
      providesTags: (_r, _e, issueId) => [{ type: 'Comment', id: issueId }],
    }),
    addComment: build.mutation<Comment, { issueId: number; body: string }>({
      query: ({ issueId, body }) => ({ url: `/issues/${issueId}/comments`, method: 'POST', body: { body } }),
      transformResponse: (r: DataResponse<Comment>) => r.data,
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Comment', id: issueId }, { type: 'Issue', id: issueId }],
    }),
    updateComment: build.mutation<Comment, { id: number; issueId: number; body: string }>({
      query: ({ id, body }) => ({ url: `/comments/${id}`, method: 'PATCH', body: { body } }),
      transformResponse: (r: DataResponse<Comment>) => r.data,
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Comment', id: issueId }],
    }),
    deleteComment: build.mutation<void, { id: number; issueId: number }>({
      query: ({ id }) => ({ url: `/comments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { issueId }) => [{ type: 'Comment', id: issueId }, { type: 'Issue', id: issueId }],
    }),
  }),
})

export const {
  useGetIssuesQuery,
  useGetBoardQuery,
  useGetIssueQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useMoveIssueMutation,
  useDeleteIssueMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = issuesApi
