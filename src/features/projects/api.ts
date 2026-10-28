import { api } from '@/store/api'
import type { Discipline, Status } from '@/lib/enums'
import type { Activity, DataResponse, Paginated, Phase, Project, StatusCounts } from '@/types/api'

export interface ProjectListParams {
  status?: string
  discipline?: Discipline | ''
  search?: string
  mine?: boolean
  sort?: string
  page?: number
  per_page?: number
}

export interface ProjectInput {
  key: string
  name: string
  client_name: string
  client_phone?: string | null
  client_email?: string | null
  address?: string | null
  discipline: Discipline
  status: Status
  budget: string
  discount_price?: string | null
  lat?: number | null
  lng?: number | null
  progress?: number
  start_date?: string | null
  end_date?: string | null
  description?: string | null
  member_ids?: number[]
}

export interface PhaseInput {
  name: string
  order?: number
  start_date?: string | null
  end_date?: string | null
  status?: Status
}

type ProjectList = Paginated<Project, { status_counts: StatusCounts }>

function cleanParams(params: ProjectListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue
    out[k] = typeof v === 'boolean' ? 1 : (v as string | number)
  }
  return out
}

const PROJECT_LIST = { type: 'Project' as const, id: 'LIST' }

export const projectsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<ProjectList, ProjectListParams | void>({
      query: (params) => ({ url: '/projects', params: cleanParams(params ?? {}) }),
      providesTags: (result) => [PROJECT_LIST, ...(result?.data.map((p) => ({ type: 'Project' as const, id: p.id })) ?? [])],
    }),
    getProject: build.query<Project, number>({
      query: (id) => `/projects/${id}`,
      transformResponse: (r: DataResponse<Project>) => r.data,
      providesTags: (_r, _e, id) => [{ type: 'Project', id }, { type: 'Phase', id: `P${id}` }],
    }),
    createProject: build.mutation<Project, ProjectInput>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      transformResponse: (r: DataResponse<Project>) => r.data,
      invalidatesTags: [PROJECT_LIST, 'Dashboard', { type: 'Activity', id: 'LIST' }],
    }),
    updateProject: build.mutation<Project, { id: number } & Partial<ProjectInput>>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Project>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }, PROJECT_LIST, 'Dashboard', 'Report', { type: 'Activity', id: 'LIST' }],
    }),
    deleteProject: build.mutation<void, number>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: [PROJECT_LIST, { type: 'Issue', id: 'LIST' }, { type: 'File', id: 'LIST' }, 'Dashboard', 'Report'],
    }),
    updateLocation: build.mutation<Project, { id: number; lat: number; lng: number; address?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}/location`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Project>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }, PROJECT_LIST],
    }),
    syncMembers: build.mutation<Project, { id: number; member_ids: number[] }>({
      query: ({ id, member_ids }) => ({ url: `/projects/${id}/members`, method: 'PUT', body: { member_ids } }),
      transformResponse: (r: DataResponse<Project>) => r.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }, PROJECT_LIST],
    }),
    getProjectActivity: build.query<Paginated<Activity>, { id: number; page?: number }>({
      query: ({ id, page }) => ({ url: `/projects/${id}/activity`, params: page ? { page } : {} }),
      providesTags: (_r, _e, { id }) => [{ type: 'Activity', id: `P${id}` }, { type: 'Activity', id: 'LIST' }],
    }),
    getMapProjects: build.query<Project[], void>({
      query: () => '/map/projects',
      transformResponse: (r: DataResponse<Project[]>) => r.data,
      providesTags: [PROJECT_LIST],
    }),
    getTimeline: build.query<Project[], { from: string; to: string }>({
      query: (params) => ({ url: '/timeline', params }),
      transformResponse: (r: DataResponse<Project[]>) => r.data,
      providesTags: [PROJECT_LIST, { type: 'Phase', id: 'LIST' }],
    }),

    // ── Phases ─────────────────────────────────────────────────────────
    createPhase: build.mutation<Phase, { projectId: number } & PhaseInput>({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/phases`, method: 'POST', body }),
      transformResponse: (r: DataResponse<Phase>) => r.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Project', id: projectId }, { type: 'Phase', id: 'LIST' }],
    }),
    updatePhase: build.mutation<Phase, { id: number; projectId: number } & Partial<PhaseInput>>({
      query: ({ id, projectId: _p, ...body }) => ({ url: `/phases/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Phase>) => r.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Project', id: projectId }, { type: 'Phase', id: 'LIST' }],
    }),
    deletePhase: build.mutation<void, { id: number; projectId: number }>({
      query: ({ id }) => ({ url: `/phases/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Project', id: projectId }, { type: 'Phase', id: 'LIST' }],
    }),
    reorderPhases: build.mutation<Phase[], { projectId: number; phase_ids: number[] }>({
      query: ({ projectId, phase_ids }) => ({ url: `/projects/${projectId}/phases/order`, method: 'PUT', body: { phase_ids } }),
      transformResponse: (r: DataResponse<Phase[]>) => r.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: 'Project', id: projectId }, { type: 'Phase', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateLocationMutation,
  useSyncMembersMutation,
  useGetProjectActivityQuery,
  useGetMapProjectsQuery,
  useGetTimelineQuery,
  useCreatePhaseMutation,
  useUpdatePhaseMutation,
  useDeletePhaseMutation,
  useReorderPhasesMutation,
} = projectsApi
