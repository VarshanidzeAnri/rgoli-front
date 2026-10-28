import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { Discipline } from '@/lib/enums'
import { isPermission, type Permission } from '@/lib/permissions'
import { readStorage, STORAGE_KEYS } from '@/lib/storage'
import type { DataResponse, LoginResult, Me, RoleRef } from '@/types/api'

import { ApiError, request } from './http'
import type { RootState } from './index'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

export interface AuthState {
  /** Sanctum token, also kept in localStorage. */
  token: string | null
  user: Me['user'] | null
  roles: RoleRef[]
  permissions: Permission[]
  disciplines: Discipline[]
  status: AuthStatus
}

const initialToken = readStorage(STORAGE_KEYS.token)

const initialState: AuthState = {
  token: initialToken,
  user: null,
  roles: [],
  permissions: [],
  disciplines: [],
  status: initialToken ? 'idle' : 'guest',
}

interface ThunkConfig {
  state: RootState
  rejectValue: { status: number; message: string; fieldErrors: Record<string, string> }
}

function toReject(error: unknown): ThunkConfig['rejectValue'] {
  if (error instanceof ApiError) return { status: error.status, message: error.message, fieldErrors: error.fieldErrors }
  return { status: 0, message: error instanceof Error ? error.message : 'Network error', fieldErrors: {} }
}

/** Loads the current user with roles, flattened permissions and disciplines. */
export const fetchMe = createAsyncThunk<Me, void, ThunkConfig>('auth/fetchMe', async (_, { getState, rejectWithValue }) => {
  const { auth, ui } = getState()
  try {
    const res = await request<DataResponse<Me>>('/me', { token: auth.token, locale: ui.locale })
    return res.data
  } catch (error) {
    return rejectWithValue(toReject(error))
  }
})

export const login = createAsyncThunk<LoginResult, { email: string; password: string }, ThunkConfig>(
  'auth/login',
  async (credentials, { getState, rejectWithValue }) => {
    try {
      const res = await request<DataResponse<LoginResult>>('/auth/login', {
        method: 'POST',
        body: credentials,
        token: null,
        locale: getState().ui.locale,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(toReject(error))
    }
  },
)

/** Revokes the token on the server (best effort) and clears local auth state. */
export const logout = createAsyncThunk<void, void, ThunkConfig>('auth/logout', async (_, { getState }) => {
  const { auth, ui } = getState()
  if (!auth.token) return
  try {
    await request('/auth/logout', { method: 'POST', token: auth.token, locale: ui.locale })
  } catch {
    // The token may already be invalid; local logout still proceeds.
  }
})

function applyMe(state: AuthState, me: Me): void {
  state.user = me.user
  state.roles = me.roles
  state.permissions = me.permissions.filter(isPermission)
  state.disciplines = me.disciplines
  state.status = 'authenticated'
}

function clear(state: AuthState): void {
  state.token = null
  state.user = null
  state.roles = []
  state.permissions = []
  state.disciplines = []
  state.status = 'guest'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Server answered 401: token is gone or revoked. */
    sessionExpired: clear,
    /** Profile edits return a fresh /me payload. */
    meUpdated(state, action: PayloadAction<Me>) {
      applyMe(state, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        applyMe(state, action.payload)
      })
      .addCase(fetchMe.rejected, (state, action) => {
        // Network errors keep the token so a reload can retry; 401 clears it.
        if (action.payload?.status === 401 || !state.token) clear(state)
        else state.status = 'guest'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token
        applyMe(state, action.payload)
      })
      .addCase(logout.fulfilled, clear)
      .addCase(logout.rejected, clear)
  },
})

export const { sessionExpired, meUpdated } = authSlice.actions
export default authSlice.reducer

// ── Selectors ───────────────────────────────────────────────────────────
export const selectAuth = (state: RootState): AuthState => state.auth
export const selectUser = (state: RootState): AuthState['user'] => state.auth.user
export const selectToken = (state: RootState): string | null => state.auth.token
export const selectAuthStatus = (state: RootState): AuthStatus => state.auth.status

export const selectPermissionSet = createSelector(
  [(state: RootState) => state.auth.permissions],
  (permissions): ReadonlySet<Permission> => new Set(permissions),
)

export const selectIsAdmin = createSelector([(state: RootState) => state.auth.roles], (roles) =>
  roles.some((role) => role.slug === 'owner'),
)

/** True when the user has the permission (or, for a list, any of them). */
export function selectCan(permission: Permission | readonly Permission[]) {
  return (state: RootState): boolean => {
    const set = selectPermissionSet(state)
    return typeof permission === 'string' ? set.has(permission) : permission.some((p) => set.has(p))
  }
}
