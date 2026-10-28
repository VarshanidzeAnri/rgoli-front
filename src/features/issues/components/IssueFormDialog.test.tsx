import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { issues, users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import IssueFormDialog from './IssueFormDialog'

describe('IssueFormDialog', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<IssueFormDialog open onClose={() => undefined} />)

    await user.click(await screen.findByRole('button', { name: 'Create' }))
    expect(await screen.findAllByText('This field is required')).toHaveLength(2)
  })

  it('creates a task in the pre-selected project and status', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.get(`${API}/people`, () => HttpResponse.json({ data: [users.designer] })),
      http.post(`${API}/issues`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ data: issues[0] }, { status: 201 })
      }),
    )
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<IssueFormDialog open projectId={1} initialStatus="review" onClose={onClose} />)

    await screen.findByRole('option', { name: /URK/ })
    await user.type(screen.getByLabelText('Title'), 'Facade drawing')
    await user.click(await screen.findByRole('checkbox', { name: /Interior Designer/ }))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await expect.poll(() => onClose.mock.calls.length).toBe(1)
    expect(body).toMatchObject({ project_id: 1, title: 'Facade drawing', status: 'review', priority: 'medium', points: 1, assignee_ids: [2] })
  })

  it('maps server 422 errors onto fields', async () => {
    server.use(
      http.post(`${API}/issues`, () => HttpResponse.json({ message: 'Invalid', errors: { title: ['Title is taken'] } }, { status: 422 })),
    )
    const user = userEvent.setup()
    renderWithProviders(<IssueFormDialog open projectId={1} onClose={() => undefined} />)

    await screen.findByRole('option', { name: /URK/ })
    await user.type(screen.getByLabelText('Title'), 'X')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Title is taken')).toBeInTheDocument()
  })
})
