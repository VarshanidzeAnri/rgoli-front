import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { issues, projects, users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'
import type { Dashboard } from '@/types/api'

import DashboardPage from './DashboardPage'

function dashboard(overrides: Partial<Dashboard['kpis']> = {}): Dashboard {
  return {
    kpis: {
      active_projects: 3,
      open_tasks: 4,
      critical_tasks: 1,
      budget: { total: '20360.00', paid: '4700.00', remaining: '15660.00' },
      pending_salary_requests: 1,
      ...overrides,
    },
    project_status_distribution: { todo: 1, progress: 1, review: 1, blocked: 0, done: 0 },
    projects,
    activity: [
      {
        id: 1,
        event: 'created',
        subject_type: 'issue',
        subject_id: 3,
        meta: { label: 'Render' },
        user: users.admin,
        project: { id: 1, key: 'URK', name: 'House' },
        created_at: new Date().toISOString(),
      },
    ],
    workload: [
      { user: users.manager, open_count: 3, open_points: 14, load_percent: 70 },
      { user: users.designer, open_count: 1, open_points: 5, load_percent: 25 },
    ],
    my_tasks_this_week: [issues[1]!],
    team_size: 4,
  }
}

describe('DashboardPage', () => {
  it('renders greeting, KPIs, projects, activity and workload', async () => {
    server.use(http.get(`${API}/dashboard`, () => HttpResponse.json({ data: dashboard() })))
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('20 360 ₾')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome, Admin' })).toBeInTheDocument()
    expect(screen.getByText('1 critical')).toBeInTheDocument()
    expect(screen.getByText('4 team members')).toBeInTheDocument()
    expect(screen.getByText('Admin created task')).toBeInTheDocument()
    expect(screen.getByText('ტოპოგრაფიული გეგმის მომზადება')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: "Project Manager's workload" })).toHaveAttribute('aria-valuenow', '70')
    expect(screen.getByRole('link', { name: /RGOLI Office Interior/ })).toHaveAttribute('href', '/projects/2')
  })

  it('hides the budget KPI without finance access and filters quick actions', async () => {
    server.use(http.get(`${API}/dashboard`, () => HttpResponse.json({ data: dashboard({ budget: null }) })))
    renderWithProviders(<DashboardPage />, { store: authedStore(['projects.view', 'issues.view', 'issues.create']) })

    expect(await screen.findByText('Open tasks')).toBeInTheDocument()
    expect(screen.queryByText('Portfolio budget')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New task' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New project' })).not.toBeInTheDocument()
  })

  it('shows an error state with retry', async () => {
    server.use(http.get(`${API}/dashboard`, () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
    renderWithProviders(<DashboardPage />)
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
