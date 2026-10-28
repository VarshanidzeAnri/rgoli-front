import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { isLocale, isTheme, type Locale, type Theme } from '@/lib/enums'
import { readStorage, STORAGE_KEYS } from '@/lib/storage'

import type { RootState } from './index'

export type DialogKind =
  | 'project'
  | 'issue'
  | 'file'
  | 'salaryRequest'
  | 'payment'
  | 'phase'
  | 'sprint'
  | 'user'
  | 'role'
  | 'location'

export interface ActiveDialog {
  kind: DialogKind
  id?: number
  projectId?: number
}

export type MapMode = 'offline' | 'osm' | 'google'

export interface UploadProgress {
  name: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}

export interface UiState {
  locale: Locale
  theme: Theme
  sidebarOpen: boolean
  mobileNavOpen: boolean
  commandPaletteOpen: boolean
  activeDialog: ActiveDialog | null
  board: { projectId: number | null; assigneeId: number | null; onlyMine: boolean }
  map: { mode: MapMode; selectedProjectId: number | null }
  uploads: Record<string, UploadProgress>
}

function initialLocale(): Locale {
  const saved = readStorage(STORAGE_KEYS.locale)
  if (isLocale(saved)) return saved
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.slice(0, 2)
  return isLocale(browser) ? browser : 'ka'
}

function initialTheme(): Theme {
  const saved = readStorage(STORAGE_KEYS.theme)
  return isTheme(saved) ? saved : 'dark'
}

const initialState: UiState = {
  locale: initialLocale(),
  theme: initialTheme(),
  sidebarOpen: readStorage(STORAGE_KEYS.sidebarOpen) !== 'false',
  mobileNavOpen: false,
  commandPaletteOpen: false,
  activeDialog: null,
  board: { projectId: null, assigneeId: null, onlyMine: false },
  map: { mode: 'offline', selectedProjectId: null },
  uploads: {},
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload
    },
    openDialog(state, action: PayloadAction<ActiveDialog>) {
      state.activeDialog = action.payload
    },
    closeDialog(state) {
      state.activeDialog = null
    },
    setBoardFilters(state, action: PayloadAction<Partial<UiState['board']>>) {
      state.board = { ...state.board, ...action.payload }
    },
    setMapMode(state, action: PayloadAction<MapMode>) {
      state.map.mode = action.payload
    },
    selectMapProject(state, action: PayloadAction<number | null>) {
      state.map.selectedProjectId = action.payload
    },
    uploadProgress(state, action: PayloadAction<{ id: string } & UploadProgress>) {
      const { id, ...progress } = action.payload
      state.uploads[id] = progress
    },
    uploadCleared(state, action: PayloadAction<string>) {
      Reflect.deleteProperty(state.uploads, action.payload)
    },
  },
})

export const {
  setLocale,
  setTheme,
  toggleTheme,
  setSidebarOpen,
  setMobileNavOpen,
  setCommandPaletteOpen,
  openDialog,
  closeDialog,
  setBoardFilters,
  setMapMode,
  selectMapProject,
  uploadProgress,
  uploadCleared,
} = uiSlice.actions

export default uiSlice.reducer

export const selectLocale = (state: RootState): Locale => state.ui.locale
export const selectTheme = (state: RootState): Theme => state.ui.theme
export const selectActiveDialog = (state: RootState): ActiveDialog | null => state.ui.activeDialog
export const selectBoardFilters = (state: RootState): UiState['board'] => state.ui.board
export const selectMap = (state: RootState): UiState['map'] => state.ui.map
export const selectUploads = (state: RootState): UiState['uploads'] => state.ui.uploads
