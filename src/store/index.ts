import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { useDispatch, useSelector } from 'react-redux'

import { api } from './api'
import authReducer from './authSlice'
import { listenerMiddleware } from './listeners'
import uiReducer from './uiSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [api.reducerPath]: api.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(listenerMiddleware.middleware).concat(api.middleware),
  })
  setupListeners(store.dispatch)
  return store
}

export const store = makeStore()

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
