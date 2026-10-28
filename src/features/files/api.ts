import type { FileType } from '@/lib/enums'
import { api, type ApiQueryError } from '@/store/api'
import { API_BASE, apiHeaders } from '@/store/http'
import type { RootState } from '@/store'
import { uploadCleared, uploadProgress } from '@/store/uiSlice'
import type { ApiErrorBody, DataResponse, Paginated, ProjectFile } from '@/types/api'

export interface FileListParams {
  project_id?: number | null
  type?: FileType | ''
  search?: string
  page?: number
}

function fileParams(params: FileListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') out[k] = v as string | number
  return out
}

/**
 * multipart upload through XMLHttpRequest so progress can be shown; progress is pushed
 * to ui.uploads under `uploadId`.
 */
function uploadWithProgress(
  form: FormData,
  { token, locale, onProgress }: { token: string | null; locale: RootState['ui']['locale']; onProgress: (pct: number) => void },
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/files`)
    apiHeaders(token, locale).forEach((value, key) => xhr.setRequestHeader(key, value))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        body = { message: xhr.statusText }
      }
      resolve({ status: xhr.status, body })
    }
    xhr.onerror = () => resolve({ status: 0, body: { message: 'Network error' } })
    xhr.send(form)
  })
}

const FILE_LIST = { type: 'File' as const, id: 'LIST' }

export const filesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFiles: build.query<Paginated<ProjectFile>, FileListParams | void>({
      query: (params) => ({ url: '/files', params: fileParams(params ?? {}) }),
      providesTags: (result) => [FILE_LIST, ...(result?.data.map((f) => ({ type: 'File' as const, id: f.id })) ?? [])],
    }),
    uploadFiles: build.mutation<ProjectFile[], { uploadId: string; projectId: number; files: File[] }>({
      async queryFn({ uploadId, projectId, files }, { getState, dispatch }) {
        const state = getState() as RootState
        const name = files.length === 1 ? (files[0]?.name ?? '') : `${files.length}×`
        const form = new FormData()
        form.append('project_id', String(projectId))
        files.forEach((file) => form.append('files[]', file))

        dispatch(uploadProgress({ id: uploadId, name, progress: 0, status: 'uploading' }))
        const { status, body } = await uploadWithProgress(form, {
          token: state.auth.token,
          locale: state.ui.locale,
          onProgress: (progress) => dispatch(uploadProgress({ id: uploadId, name, progress, status: 'uploading' })),
        })

        if (status >= 200 && status < 300) {
          dispatch(uploadProgress({ id: uploadId, name, progress: 100, status: 'done' }))
          setTimeout(() => dispatch(uploadCleared(uploadId)), 2500)
          return { data: (body as DataResponse<ProjectFile[]>).data }
        }

        dispatch(uploadProgress({ id: uploadId, name, progress: 100, status: 'error' }))
        const err = body as ApiErrorBody
        const error: ApiQueryError = {
          status: status || 'FETCH_ERROR',
          message: err.message,
          fieldErrors: Object.fromEntries(Object.entries(err.errors ?? {}).map(([k, v]) => [k, v[0] ?? ''])),
        }
        return { error }
      },
      invalidatesTags: [FILE_LIST],
    }),
    deleteFile: build.mutation<void, number>({
      query: (id) => ({ url: `/files/${id}`, method: 'DELETE' }),
      invalidatesTags: [FILE_LIST],
    }),
  }),
})

export const { useGetFilesQuery, useUploadFilesMutation, useDeleteFileMutation } = filesApi
