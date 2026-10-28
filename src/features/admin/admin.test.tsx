
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { PERMISSION_GROUPS, type Permission } from '@/lib/permissions'
import RolesPage from '@/pages/RolesPage'
import UsersPage from '@/pages/UsersPage'
import { paginated, users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'
import type { AdminUser, Role } from '@/types/api'

import { PermissionPicker } from './components/PermissionPicker'
import { UserFormDialog } from './components/UserFormDialog'

const roles: Role[] = [
  { id: 1, slug: 'owner', name: 'Owner', is_system: true, is_owner: true, permissions: [], users_count: 1 },
  { id: 2, slug: 'interior_designer', name: 'Interior Designer', is_system: true, is_owner: false, permissions: ['projects.view', 'issues.view'], users_count: 1 },
  { id: 7, slug: null, name: 'Intern', is_system: false, is_owner: false, permissions: [], users_count: 0 },
]

const designer: AdminUser = {
  ...users.designer,
  email: 'designer@rgoli.ge',
  roles: [{ id: 2, slug: 'interior_designer', name: 'Interior Designer' }],
  direct_permissions: [],
  permissions: ['projects.view', 'issues.view', 'issues.create', 'files.view', 'files.upload'],
  disciplines: ['interior'],
  created_at: null,
}

function useAdminApi() {
  const calls: { method: string; url: string; body: unknown }[] = []
  server.use(
    http.get(`${API}/users`, () => HttpResponse.json(paginated([designer]))),
    http.get(`${API}/roles`, () => HttpResponse.json({ data: roles })),
    http.get(`${API}/admin/stats`, () =>
      HttpResponse.json({ data: { users: 4, active_users: 4, projects: 3, issues: 5, files: 3, storage_bytes: 2048, client_payments: 3, salary_requests: 2, activity_logs: 10, demo: true } }),
    ),
    http.patch(`${API}/users/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Partial<AdminUser>
      calls.push({ method: 'PATCH', url: `/users/${String(params.id)}`, body })
      return HttpResponse.json({ data: { ...designer, ...body } })
    }),
    http.patch(`${API}/roles/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Partial<Role>
      calls.push({ method: 'PATCH', url: `/roles/${String(params.id)}`, body })
      const role = roles.find((r) => r.id === Number(params.id)) ?? roles[1]
      return HttpResponse.json({ data: { ...role, ...body } })
    }),
  )
  return calls
}

describe('UsersPage', () => {
  it('lists users with role, tags and system stats, and toggles active optimistically', async () => {
    const calls = useAdminApi()
    renderWithProviders(<UsersPage />)

    expect((await screen.findAllByText('Interior Designer', { selector: 'span' })).length).toBeGreaterThan(0)
    expect(screen.getAllByText('designer@rgoli.ge').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+2').length).toBeGreaterThan(0)
    expect(await screen.findByText('2 KB')).toBeInTheDocument()

    const toggle = screen.getAllByRole('switch', { name: 'Interior Designer — active' })[0]
    if (!toggle) throw new Error('switch missing')
    await userEvent.click(toggle)

    await waitFor(() => expect(calls).toContainEqual({ method: 'PATCH', url: '/users/2', body: { is_active: false } }))
  })

  it('is read-only without users.manage', async () => {
    useAdminApi()
    renderWithProviders(<UsersPage />, { store: authedStore(['users.view']) })

    expect((await screen.findAllByText('designer@rgoli.ge')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /New user/ })).not.toBeInTheDocument()
    expect(screen.queryByText('System')).not.toBeInTheDocument()
    screen.getAllByRole('switch').forEach((s) => expect(s).toBeDisabled())
  })
})

describe('UserFormDialog', () => {
  it('validates required fields on create', async () => {
    useAdminApi()
    renderWithProviders(<UserFormDialog open onClose={() => undefined} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))

    expect((await screen.findAllByText('This field is required')).length).toBeGreaterThan(0)
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
  })

  it('saves edits with direct permissions and maps 422 errors to fields', async () => {
    useAdminApi()
    let received: Record<string, unknown> | null = null
    server.use(
      http.patch(`${API}/users/:id`, async ({ request }) => {
        received = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ message: 'The email has already been taken.', errors: { email: ['The email has already been taken.'] } }, { status: 422 })
      }),
    )
    renderWithProviders(<UserFormDialog open onClose={() => undefined} user={designer} />)

    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByLabelText(/View reports/))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await within(dialog).findByText('The email has already been taken.')).toBeInTheDocument()
    expect(received).toMatchObject({ role_id: 2, direct_permissions: ['reports.view'], disciplines: ['interior'], is_active: true })
    expect(received).not.toHaveProperty('password')
  })
})

describe('PermissionPicker', () => {
  function Harness({ initial }: { initial: Permission[] }) {
    const [value, setValue] = useState<Permission[]>(initial)
    return (
      <>
        <PermissionPicker value={value} onChange={setValue} />
        <output data-testid="value">{[...value].sort().join(',')}</output>
      </>
    )
  }

  it('shows indeterminate groups and selects all in a group', async () => {
    renderWithProviders(<Harness initial={['map.view']} />)

    const mapAll = await screen.findByRole('checkbox', { name: 'Select all in group · Map' })
    expect(mapAll).toHaveAttribute('aria-checked', 'mixed')

    await userEvent.click(mapAll)
    expect(screen.getByTestId('value')).toHaveTextContent([...PERMISSION_GROUPS.map].sort().join(','))

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all in group · Map' }))
    expect(screen.getByTestId('value')).toHaveTextContent(/^$/)
  })
})

describe('RolesPage', () => {
  it('locks the Owner role and edits another role with select-all', async () => {
    const calls = useAdminApi()
    renderWithProviders(<RolesPage />, { store: authedStore(['roles.manage']) })

    expect(await screen.findByRole('note')).toHaveTextContent('The Owner always has every permission')
    expect(screen.getByRole('checkbox', { name: 'Select all in group · Projects' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /Interior Designer/ }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select all in group · Reports' }))
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }))

    await waitFor(() => {
      const call = calls.find((c) => c.url === '/roles/2')
      expect((call?.body as { permissions: string[] } | undefined)?.permissions).toEqual(
        expect.arrayContaining(['projects.view', 'issues.view', 'reports.view', 'reports.export']),
      )
    })
  })

  it('shows the server reason when a role in use cannot be deleted', async () => {
    useAdminApi()
    server.use(
      http.delete(`${API}/roles/:id`, () =>
        HttpResponse.json({ message: 'This role is assigned to users and cannot be deleted.', errors: { role: ['This role is assigned to users and cannot be deleted.'] } }, { status: 422 }),
      ),
    )
    renderWithProviders(<RolesPage />, { store: authedStore(['roles.manage']) })

    await userEvent.click(await screen.findByRole('button', { name: /Intern/ }))
    expect(screen.queryByRole('button', { name: /^Delete role/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Delete role/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('This role is assigned to users and cannot be deleted.')).toBeInTheDocument()
  })

  it('never offers deletion for system roles', async () => {
    useAdminApi()
    renderWithProviders(<RolesPage />, { store: authedStore(['roles.manage']) })
    await userEvent.click(await screen.findByRole('button', { name: /Interior Designer/ }))
    expect(screen.queryByRole('button', { name: /Delete role/ })).not.toBeInTheDocument()
  })
})
