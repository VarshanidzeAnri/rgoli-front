import { api } from '@/store/api'
import { meUpdated } from '@/store/authSlice'
import type { DataResponse, Me } from '@/types/api'

/** Profile mutations return a fresh /me payload, which is pushed into the auth slice. */
export const profileApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateProfile: build.mutation<Me, { name?: string; job_title?: string | null }>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      transformResponse: (r: DataResponse<Me>) => r.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(meUpdated(data))
      },
      invalidatesTags: [{ type: 'User', id: 'PEOPLE' }],
    }),
    uploadAvatar: build.mutation<Me, File>({
      query: (file) => {
        const body = new FormData()
        body.append('avatar', file)
        return { url: '/me/avatar', method: 'POST', body }
      },
      transformResponse: (r: DataResponse<Me>) => r.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(meUpdated(data))
      },
      invalidatesTags: [{ type: 'User', id: 'PEOPLE' }],
    }),
    changePassword: build.mutation<void, { current_password: string; password: string; password_confirmation: string }>({
      query: (body) => ({ url: '/me/password', method: 'PUT', body }),
    }),
    forgotPassword: build.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation<void, { email: string; token: string; password: string; password_confirmation: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
  }),
})

export const {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = profileApi
