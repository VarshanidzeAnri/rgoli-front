import { api } from '@/store/api'
import type {
  Activity,
  AppConfig,
  AppNotification,
  CalendarEvent,
  Dashboard,
  DataResponse,
  DemoAccount,
  Paginated,
  PublicStats,
  SearchResults,
  UserSummary,
} from '@/types/api'

/** Cross-feature reads: config, login stats, dashboard, calendar, search, people, activity, notifications. */
export const workspaceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConfig: build.query<AppConfig, void>({
      query: () => '/config',
      transformResponse: (r: DataResponse<AppConfig>) => r.data,
      keepUnusedDataFor: 3600,
    }),
    getPublicStats: build.query<PublicStats, void>({
      query: () => '/public/stats',
      transformResponse: (r: DataResponse<PublicStats>) => r.data,
    }),
    getDemoAccounts: build.query<DemoAccount[], void>({
      query: () => '/auth/demo-accounts',
      transformResponse: (r: DataResponse<DemoAccount[]>) => r.data,
    }),
    getDashboard: build.query<Dashboard, void>({
      query: () => '/dashboard',
      transformResponse: (r: DataResponse<Dashboard>) => r.data,
      providesTags: ['Dashboard'],
    }),
    getCalendar: build.query<CalendarEvent[], { from: string; to: string }>({
      query: (params) => ({ url: '/calendar', params }),
      transformResponse: (r: DataResponse<CalendarEvent[]>) => r.data,
      providesTags: [{ type: 'Issue', id: 'LIST' }, { type: 'Project', id: 'LIST' }],
    }),
    search: build.query<SearchResults, string>({
      query: (q) => ({ url: '/search', params: { q } }),
      transformResponse: (r: DataResponse<SearchResults>) => r.data,
      keepUnusedDataFor: 30,
    }),
    getPeople: build.query<UserSummary[], void>({
      query: () => '/people',
      transformResponse: (r: DataResponse<UserSummary[]>) => r.data,
      providesTags: [{ type: 'User', id: 'PEOPLE' }],
    }),
    getActivity: build.query<Paginated<Activity>, { page?: number; per_page?: number } | void>({
      query: (params) => ({ url: '/activity', params: params ?? {} }),
      providesTags: [{ type: 'Activity', id: 'LIST' }],
    }),
    getNotifications: build.query<Paginated<AppNotification, { unread: number }>, void>({
      query: () => '/notifications',
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetConfigQuery,
  useGetPublicStatsQuery,
  useGetDemoAccountsQuery,
  useGetDashboardQuery,
  useGetCalendarQuery,
  useSearchQuery,
  useGetPeopleQuery,
  useGetActivityQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = workspaceApi
