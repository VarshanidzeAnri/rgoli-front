import type { Discipline } from '@/lib/enums'
import type { Permission } from '@/lib/permissions'
import { api } from '@/store/api'
import type { AdminUser, DataResponse, Paginated, PermissionCatalog, Role, SystemStats } from '@/types/api'

export interface UserInput {
  name: string
  email: string
  password?: string
  job_title?: string | null
  is_active?: boolean
  role_id: number
  direct_permissions?: Permission[]
  disciplines?: Discipline[]
}

export interface UserListParams {
  search?: string
  role_id?: number | null
  active?: boolean | null
  page?: number
}

const USER_LIST = { type: 'User' as const, id: 'LIST' }
const PEOPLE = { type: 'User' as const, id: 'PEOPLE' }

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Users ──────────────────────────────────────────────────────────
    getUsers: build.query<Paginated<AdminUser>, UserListParams | void>({
      query: (p) => ({
        url: '/users',
        params: Object.fromEntries(
          Object.entries(p ?? {})
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 1 : 0) : v]),
        ),
      }),
      providesTags: (result) => [USER_LIST, ...(result?.data.map((u) => ({ type: 'User' as const, id: u.id })) ?? [])],
    }),
    createUser: build.mutation<AdminUser, UserInput>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (r: DataResponse<AdminUser>) => r.data,
      invalidatesTags: [USER_LIST, PEOPLE, 'Role'],
    }),
    updateUser: build.mutation<AdminUser, { id: number } & Partial<UserInput>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<AdminUser>) => r.data,
      /** Optimistic active toggle in user lists. */
      async onQueryStarted({ id, is_active }, lifecycle) {
        const { dispatch, queryFulfilled } = lifecycle
        if (is_active === undefined) return
        const patches = adminApi.util
          .selectInvalidatedBy(lifecycle.getState(), [USER_LIST])
          .filter((e) => e.endpointName === 'getUsers')
          .map((e) =>
            dispatch(
              adminApi.util.updateQueryData('getUsers', e.originalArgs as UserListParams | undefined, (draft) => {
                const row = draft.data.find((u) => u.id === id)
                if (row) row.is_active = is_active
              }),
            ),
          )
        try {
          await queryFulfilled
        } catch {
          patches.forEach((p) => p.undo())
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, USER_LIST, PEOPLE, 'Role'],
    }),
    sendPasswordReset: build.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}/password-reset-link`, method: 'POST' }),
    }),

    // ── Roles ──────────────────────────────────────────────────────────
    getRoles: build.query<Role[], void>({
      query: () => '/roles',
      transformResponse: (r: DataResponse<Role[]>) => r.data,
      providesTags: ['Role'],
    }),
    getPermissionCatalog: build.query<PermissionCatalog, void>({
      query: () => '/permissions',
      transformResponse: (r: DataResponse<PermissionCatalog>) => r.data,
      keepUnusedDataFor: 3600,
    }),
    createRole: build.mutation<Role, { name: string; permissions: Permission[] }>({
      query: (body) => ({ url: '/roles', method: 'POST', body }),
      transformResponse: (r: DataResponse<Role>) => r.data,
      invalidatesTags: ['Role'],
    }),
    updateRole: build.mutation<Role, { id: number; name?: string; permissions?: Permission[] }>({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Role>) => r.data,
      invalidatesTags: ['Role', USER_LIST],
    }),
    deleteRole: build.mutation<void, number>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role'],
    }),

    // ── System ─────────────────────────────────────────────────────────
    getSystemStats: build.query<SystemStats, void>({
      query: () => '/admin/stats',
      transformResponse: (r: DataResponse<SystemStats>) => r.data,
    }),
    exportSystem: build.mutation<void, void>({
      query: () => ({ url: '/admin/export', method: 'POST' }),
    }),
    resetDemo: build.mutation<void, void>({
      query: () => ({ url: '/admin/reset-demo', method: 'POST' }),
    }),
  }),
})

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSendPasswordResetMutation,
  useGetRolesQuery,
  useGetPermissionCatalogQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetSystemStatsQuery,
  useExportSystemMutation,
  useResetDemoMutation,
} = adminApi
