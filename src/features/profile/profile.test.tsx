
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ProfilePage from '@/pages/ProfilePage'
import { me } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'

import { avatarError } from './avatar'

describe('avatarError', () => {
  it('accepts jpg/png/webp up to 2 MB', () => {
    expect(avatarError({ type: 'image/png', size: 1000 })).toBeNull()
    expect(avatarError({ type: 'image/gif', size: 1000 })).toBe('avatar.wrongType')
    expect(avatarError({ type: 'image/webp', size: 3 * 1024 * 1024 })).toBe('avatar.tooLarge')
  })
})

describe('ProfilePage', () => {
  it('switches language and theme in the browser only', async () => {
    const store = authedStore(['projects.view'], { theme: 'dark' })
    renderWithProviders(<ProfilePage />, { store })

    await userEvent.click(await screen.findByRole('radio', { name: /Русский/ }))
    await waitFor(() => expect(store.getState().ui.locale).toBe('ru'))
    expect(localStorage.getItem('rgoli.locale')).toBe('ru')

    await userEvent.click(await screen.findByRole('radio', { name: /Светлая/ }))
    expect(store.getState().ui.theme).toBe('light')
    expect(localStorage.getItem('rgoli.theme')).toBe('light')
  })

  it('saves the name and pushes the new profile into the store', async () => {
    let body: unknown = null
    server.use(
      http.patch(`${API}/me`, async ({ request }) => {
        body = await request.json()
        const base = me()
        return HttpResponse.json({ data: { ...base, user: { ...base.user, name: 'Nino' } } })
      }),
    )
    const store = authedStore()
    renderWithProviders(<ProfilePage />, { store })

    const name = await screen.findByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Nino')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(store.getState().auth.user?.name).toBe('Nino'))
    expect(body).toMatchObject({ name: 'Nino' })
  })

  it('validates password confirmation and maps a wrong current password', async () => {
    server.use(
      http.put(`${API}/me/password`, () =>
        HttpResponse.json({ message: 'The password is incorrect.', errors: { current_password: ['The password is incorrect.'] } }, { status: 422 }),
      ),
    )
    renderWithProviders(<ProfilePage />)

    await userEvent.type(await screen.findByLabelText('Current password'), 'wrong')
    await userEvent.type(screen.getByLabelText('New password'), 'newpass123')
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'different1')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Repeat new password'))
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'newpass123')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('The password is incorrect.')).toBeInTheDocument()
  })

  it('shows roles, disciplines and grouped permissions read-only', async () => {
    renderWithProviders(<ProfilePage />, { store: authedStore(['projects.view', 'reports.view']) })

    expect(await screen.findByText('Architecture')).toBeInTheDocument()
    expect(screen.getByText('View projects')).toBeInTheDocument()
    expect(screen.getByText('View reports')).toBeInTheDocument()
    expect(screen.queryByText('Manage users')).not.toBeInTheDocument()
  })

  it('rejects oversized avatars before uploading', async () => {
    renderWithProviders(<ProfilePage />)
    const input = await screen.findByLabelText('Choose image', { selector: 'input' })
    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    await userEvent.upload(input, big)
    expect(await screen.findByText('The file is larger than 2 MB')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })
})
