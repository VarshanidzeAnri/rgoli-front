import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

import { Providers } from '@/app/providers'
import { ALL_PERMISSIONS, type Permission } from '@/lib/permissions'
import { makeStore, type RootState } from '@/store'

import { me } from './msw/fixtures'

/**
 * Store preloaded as an authenticated user with the given permissions
 * (default: everything, like the Owner).
 */
export function authedStore(permissions: readonly Permission[] = ALL_PERMISSIONS, ui: Partial<RootState['ui']> = {}) {
  const profile = me(permissions)
  const base = makeStore().getState()
  return makeStore({
    auth: { token: 'test-token', status: 'authenticated', ...profile, permissions: [...permissions] },
    ui: { ...base.ui, locale: 'en', ...ui },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  { store = authedStore(), route = '/', path = '*', ...options }: { store?: ReturnType<typeof makeStore>; route?: string; path?: string } & RenderOptions = {},
) {
  const routes: RouteObject[] = [{ path, element: ui }]
  const router = createMemoryRouter(routes, { initialEntries: [route] })
  return {
    store,
    router,
    ...render(
      <Providers appStore={store}>
        <RouterProvider router={router} />
      </Providers>,
      options,
    ),
  }
}
