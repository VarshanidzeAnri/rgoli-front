import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import FinancePage from '@/pages/FinancePage'
import { paginated, users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'
import type { FinanceSummary, SalaryRequest } from '@/types/api'

const summary: FinanceSummary = {
  total_budget: '20360.00',
  paid_by_clients: '4700.00',
  paid_percent: 23,
  remaining: '15660.00',
  approved_salaries: '300.00',
  pending_requests: 1,
  pending_amount: '500.00',
  payments_this_month: '1500.00',
  projects: [
    {
      project: { id: 1, key: 'URK', name: 'House', status: 'progress' },
      budget: '13800.00',
      discount_price: '9960.00',
      agreed_price: '9960.00',
      paid: '3500.00',
      remaining: '6460.00',
    },
  ],
}

const pending: SalaryRequest = {
  id: 7,
  project: { id: 1, key: 'URK', name: 'House' },
  user: users.manager,
  title: 'ტოპოგრაფიული გეგმა',
  amount: '500.00',
  note: null,
  status: 'pending',
  decided_at: null,
  decision_note: null,
  can: { decide: true, update: false },
  created_at: '2026-10-27T10:00:00+00:00',
}

function useFinanceApi(rows: SalaryRequest[] = [pending]) {
  server.use(
    http.get(`${API}/finance/summary`, () => HttpResponse.json({ data: summary })),
    http.get(`${API}/salary-requests`, () => HttpResponse.json(paginated(rows))),
    http.get(`${API}/client-payments`, () => HttpResponse.json(paginated([]))),
  )
}

describe('FinancePage', () => {
  it('shows KPIs and the budget table with finance.view', async () => {
    useFinanceApi()
    renderWithProviders(<FinancePage />)

    expect(await screen.findByText('20 360 ₾', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Salary requests')).toBeInTheDocument()
    const table = await screen.findByRole('table')
    expect(within(table).getByText('6 460 ₾')).toBeInTheDocument()
    expect(within(table).getByText('Total')).toBeInTheDocument()
  })

  it('shows only own requests and no budget numbers without finance.view', async () => {
    useFinanceApi([{ ...pending, can: { decide: false, update: true } }])
    renderWithProviders(<FinancePage />, { store: authedStore(['salary.request', 'projects.view']) })

    expect(await screen.findByText('My requests')).toBeInTheDocument()
    expect(screen.queryByText('Total budget')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Withdraw' })).toBeInTheDocument()
  })

  it('approves optimistically and confirms with a toast', async () => {
    useFinanceApi()
    let current = pending
    server.use(
      http.get(`${API}/salary-requests`, () => HttpResponse.json(paginated([current]))),
      http.post(`${API}/salary-requests/7/approve`, () => {
        current = { ...pending, status: 'approved', can: { decide: false, update: false } }
        return HttpResponse.json({ data: current })
      }),
    )
    renderWithProviders(<FinancePage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Approved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(await screen.findByText('Request approved')).toBeInTheDocument()
  })
})
