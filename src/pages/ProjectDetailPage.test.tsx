import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { paginated, projects } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'

import ProjectDetailPage from './ProjectDetailPage'

const route = { route: '/projects/1', path: '/projects/:id' }

describe('ProjectDetailPage', () => {
  it('shows the overview with finance numbers for finance users', async () => {
    renderWithProviders(<ProjectDetailPage />, route)

    expect(await screen.findByRole('heading', { name: projects[0]!.name })).toBeInTheDocument()
    expect(screen.getByText('13 800 ₾')).toBeInTheDocument()
    expect(screen.getByText('6 460 ₾')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Payments' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('hides finance and admin actions for limited users', async () => {
    server.use(http.get(`${API}/projects/1`, () => HttpResponse.json({ data: { ...projects[0]!, finance: null } })))
    renderWithProviders(<ProjectDetailPage />, { ...route, store: authedStore(['projects.view', 'issues.view', 'files.view']) })

    expect(await screen.findByRole('heading', { name: projects[0]!.name })).toBeInTheDocument()
    expect(screen.queryByText('Finance')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Payments' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Manage members' })).not.toBeInTheDocument()
  })

  it('loads tasks in the Tasks tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectDetailPage />, route)

    await user.click(await screen.findByRole('tab', { name: 'Tasks' }))
    expect(await screen.findByText('ვიზუალიზაცია / რენდერი')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /URK-3/ })).toHaveAttribute('href', '/board?issue=3')
  })

  it('lists payments in the Payments tab', async () => {
    server.use(
      http.get(`${API}/projects/1/payments`, () =>
        HttpResponse.json(
          paginated([{ id: 9, project_id: 1, amount: '2000.00', paid_at: '2026-10-19', method: 'bank_transfer', note: 'Advance', created_at: null }]),
        ),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<ProjectDetailPage />, route)

    await user.click(await screen.findByRole('tab', { name: 'Payments' }))
    expect(await screen.findByText('Advance')).toBeInTheDocument()
    expect(screen.getByText('Bank transfer')).toBeInTheDocument()
  })

  it('shows a not-found state for a missing project', async () => {
    renderWithProviders(<ProjectDetailPage />, { route: '/projects/999', path: '/projects/:id' })
    expect(await screen.findByText('Project not found')).toBeInTheDocument()
  })
})
