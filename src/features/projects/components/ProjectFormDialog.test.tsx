import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { projects } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import ProjectFormDialog from './ProjectFormDialog'

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Code'), 'btm')
  await user.type(screen.getByLabelText('Name'), 'Batumi villa')
  await user.type(screen.getByLabelText('Client'), 'Nino')
  await user.type(screen.getByLabelText('Budget (₾)'), '25000.50')
}

describe('ProjectFormDialog', () => {
  it('validates required fields and the key format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectFormDialog open onClose={vi.fn()} />)

    await user.type(await screen.findByLabelText('Code'), '1x')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('2–10 uppercase Latin letters or digits, starting with a letter')).toBeInTheDocument()
    expect(screen.getAllByText('This field is required').length).toBeGreaterThanOrEqual(2)
  })

  it('picks dates from the calendar and disables end dates before the start', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectFormDialog open onClose={vi.fn()} />)

    await user.click(await screen.findByLabelText('Start'))
    await user.click(await screen.findByRole('button', { name: 'Today' }))
    expect(screen.getByLabelText('Start')).not.toHaveTextContent('Pick a date')

    await user.click(screen.getByLabelText('End'))
    const grid = await screen.findByRole('grid')
    const disabled = grid.querySelectorAll('button[disabled]')
    expect(disabled.length).toBeGreaterThan(0)
  })

  it('creates a project with converted values and closes', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/projects`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ data: { ...projects[0]!, id: 7, key: 'BTM' } }, { status: 201 })
      }),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ProjectFormDialog open onClose={onClose} />)

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(body).toMatchObject({
      key: 'BTM',
      name: 'Batumi villa',
      client_name: 'Nino',
      budget: '25000.50',
      discount_price: null,
      progress: 0,
      lat: null,
      discipline: 'architecture',
      status: 'todo',
    })
  })

  it('maps server validation errors onto fields', async () => {
    server.use(
      http.post(`${API}/projects`, () =>
        HttpResponse.json({ message: 'Invalid', errors: { key: ['The project code has already been taken.'] } }, { status: 422 }),
      ),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ProjectFormDialog open onClose={onClose} />)

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The project code has already been taken.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prefills the form when editing', async () => {
    renderWithProviders(<ProjectFormDialog open onClose={vi.fn()} id={1} />)
    expect(await screen.findByDisplayValue('URK')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13800.00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit project' })).toBeInTheDocument()
  })
})
