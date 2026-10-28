import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import i18n from '@/i18n'
import { STORAGE_KEYS, writeStorage } from '@/lib/storage'

import { login, logout, sessionExpired } from './authSlice'
import { api } from './api'
import type { AppDispatch, RootState } from './index'
import { setLocale, setSidebarOpen, setTheme, toggleTheme } from './uiSlice'

/**
 * Side effects for client-side preferences. Only token, locale, theme and sidebar state are
 * persisted (localStorage); server data never is.
 */
export const listenerMiddleware = createListenerMiddleware()

const startAppListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>()

startAppListening({
  actionCreator: setLocale,
  effect: async (action, listenerApi) => {
    writeStorage(STORAGE_KEYS.locale, action.payload)
    document.documentElement.lang = action.payload
    await i18n.changeLanguage(action.payload)
    // Server texts (validation, enum labels, notifications) are localised per request.
    listenerApi.dispatch(api.util.invalidateTags(['Notification', 'Activity', 'Dashboard', 'Report']))
  },
})

startAppListening({
  matcher: isAnyOf(setTheme, toggleTheme),
  effect: (_, listenerApi) => {
    const { theme } = listenerApi.getState().ui
    writeStorage(STORAGE_KEYS.theme, theme)
    document.documentElement.dataset.theme = theme
  },
})

startAppListening({
  actionCreator: setSidebarOpen,
  effect: (action) => {
    writeStorage(STORAGE_KEYS.sidebarOpen, String(action.payload))
  },
})

startAppListening({
  actionCreator: login.fulfilled,
  effect: (action) => {
    writeStorage(STORAGE_KEYS.token, action.payload.token)
  },
})

startAppListening({
  matcher: isAnyOf(logout.fulfilled, logout.rejected, sessionExpired),
  effect: (_, listenerApi) => {
    writeStorage(STORAGE_KEYS.token, null)
    // Drop every cached server response of the previous user.
    listenerApi.dispatch(api.util.resetApiState())
  },
})
