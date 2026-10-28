import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { applyMove } from '@/features/issues/api'
import { issues } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore } from '@/test/render'
import type { Board } from '@/types/api'

import { fetchMe, login, logout, selectCan, selectIsAdmin, sessionExpired } from './authSlice'
import { makeStore } from './index'
import { setLocale, toggleTheme } from './uiSlice'

describe('authSlice', () => {
  it('logs in, stores the token and flattened permissions', async () => {
    const store = makeStore()
    await store.dispatch(login({ email: 'admin@rgoli.ge', password: 'admin123' }))

    const { auth } = store.getState()
    expect(auth.status).toBe('authenticated')
    expect(auth.token).toBe('1|test-token')
    expect(localStorage.getItem('rgoli.token')).toBe('1|test-token')
    expect(selectCan('finance.view')(store.getState())).toBe(true)
    expect(selectIsAdmin(store.getState())).toBe(true)
  })

  it('rejects wrong credentials with the server message', async () => {
    const store = makeStore()
    const result = await store.dispatch(login({ email: 'admin@rgoli.ge', password: 'nope' }))
    expect(login.rejected.match(result)).toBe(true)
    expect(result.payload).toMatchObject({ status: 422 })
    expect(store.getState().auth.status).toBe('guest')
  })

  it('clears the session on logout and on 401', async () => {
    const store = authedStore()
    await store.dispatch(logout())
    expect(store.getState().auth.token).toBeNull()

    const other = authedStore()
    other.dispatch(sessionExpired())
    expect(other.getState().auth.status).toBe('guest')
  })

  it('drops an invalid stored token when /me answers 401', async () => {
    server.use(http.get(`${API}/me`, () => HttpResponse.json({ message: 'x' }, { status: 401 })))
    const store = authedStore()
    await store.dispatch(fetchMe())
    expect(store.getState().auth.token).toBeNull()
  })

  it('checks lists of permissions with any-semantics', () => {
    const store = authedStore(['salary.request'])
    expect(selectCan(['finance.view', 'salary.request'])(store.getState())).toBe(true)
    expect(selectCan('finance.view')(store.getState())).toBe(false)
  })
})

describe('uiSlice', () => {
  it('persists locale and theme to localStorage and the document', async () => {
    const store = makeStore()
    store.dispatch(setLocale('ru'))
    store.dispatch(toggleTheme())
    await Promise.resolve()
    expect(localStorage.getItem('rgoli.locale')).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    expect(localStorage.getItem('rgoli.theme')).toBe(store.getState().ui.theme)
    expect(document.documentElement.dataset.theme).toBe(store.getState().ui.theme)
  })
})

describe('applyMove (optimistic board update)', () => {
  const board = (): Board => ({
    todo: structuredClone(issues.filter((i) => i.status === 'todo')),
    progress: structuredClone(issues.filter((i) => i.status === 'progress')),
    review: [],
    blocked: [],
    done: structuredClone(issues.filter((i) => i.status === 'done')),
  })

  it('moves an issue to the top of another column', () => {
    const b = board()
    applyMove(b, 3, 'progress', null)
    expect(b.todo).toHaveLength(0)
    expect(b.progress.map((i) => i.id)).toEqual([3, 2])
    expect(b.progress[0]?.status).toBe('progress')
  })

  it('places an issue directly below another card', () => {
    const b = board()
    applyMove(b, 3, 'progress', 2)
    expect(b.progress.map((i) => [i.id, i.position])).toEqual([
      [2, 0],
      [3, 1],
    ])
  })
})
