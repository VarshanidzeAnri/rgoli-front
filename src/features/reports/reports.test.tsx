import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ReportsPage from '@/pages/ReportsPage'
import { users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'
import type { ReportSummary } from '@/types/api'

const report = (over: Partial<ReportSummary> = {}): ReportSummary => ({
  task_completion_percent: 20,
  average_progress: 41,
  outstanding_budget: '15660.00',
  task_status: { todo: 1, progress: 1, review: 1, blocked: 1, done: 1 },
  planned_vs_paid: [{ project: 'URK', name: 'House', planned: '9960.00', paid: '3500.00' }],
  workload: [
    { user: users.manager, open_count: 3, open_points: 14, load_percent: 70 },
    { user: users.designer, open_count: 1, open_points: 2, load_percent: 10 },
  ],
  ...over,
})

describe('ReportsPage', () => {
  it('shows KPIs, charts, workload warnings and export buttons', async () => {
    server.use(http.get(`${API}/reports/summary`, () => HttpResponse.json({ data: report() })))
    renderWithProviders(<ReportsPage />)

    expect(await screen.findByText('20%', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('41%')).toBeInTheDocument()
    expect(screen.getByText('15 660 ₾')).toBeInTheDocument()
    expect(screen.getByText('Tasks by status')).toBeInTheDocument()
    expect(screen.getByText('Planned vs paid')).toBeInTheDocument()
    expect(screen.getByText(/High load/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tasks CSV' })).toBeInTheDocument()
  })

  it('offers a table view of the status chart', async () => {
    server.use(http.get(`${API}/reports/summary`, () => HttpResponse.json({ data: report() })))
    renderWithProviders(<ReportsPage />)

    const [toggle] = await screen.findAllByRole('button', { name: 'Show table' })
    await userEvent.click(toggle!)
    expect(screen.getByRole('columnheader', { name: 'Count' })).toBeInTheDocument()
  })

  it('hides budget data and export without the permissions', async () => {
    server.use(
      http.get(`${API}/reports/summary`, () => HttpResponse.json({ data: report({ outstanding_budget: null, planned_vs_paid: [] }) })),
    )
    renderWithProviders(<ReportsPage />, { store: authedStore(['reports.view', 'projects.view']) })

    expect(await screen.findByText('20%', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByText('Outstanding budget')).not.toBeInTheDocument()
    expect(screen.queryByText('Planned vs paid')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tasks CSV' })).not.toBeInTheDocument()
  })

  it('sends the date range to the API', async () => {
    const urls: string[] = []
    server.use(
      http.get(`${API}/reports/summary`, ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({ data: report() })
      }),
    )
    renderWithProviders(<ReportsPage />)
    await screen.findByText('20%', { selector: 'p' })

    await userEvent.click(screen.getByLabelText('Period — from'))
    const grid = await screen.findByRole('grid')
    const day = within(grid)
      .getAllByRole('button')
      .find((b) => b.textContent === '15' && !b.hasAttribute('disabled'))
    expect(day).toBeDefined()
    await userEvent.click(day!)

    await waitFor(() => expect(urls.some((u) => /from=\d{4}-\d{2}-15/.test(u))).toBe(true))
  })
})
