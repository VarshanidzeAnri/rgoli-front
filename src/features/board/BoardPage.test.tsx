import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import BoardPage from '@/pages/BoardPage'
import { issues, paginated } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'

function mockIssueDetail() {
  server.use(
    http.get(`${API}/issues/:id`, ({ params }) => {
      const issue = issues.find((i) => i.id === Number(params.id))
      return issue ? HttpResponse.json({ data: issue }) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }),
    http.get(`${API}/issues/:id/comments`, () => HttpResponse.json(paginated([]))),
  )
}

describe('BoardPage', () => {
  it('renders five status columns with their cards and counts', async () => {
    renderWithProviders(<BoardPage />, { route: '/board', path: '/board' })

    const progress = await screen.findByRole('region', { name: 'In progress — 1' })
    expect(within(progress).getByText('ტოპოგრაფიული გეგმის მომზადება')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'To do — 1' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Review — 0' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Blocked — 0' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Done — 1' })).toBeInTheDocument()
  })

  it('opens the task drawer from a card and keeps it in the URL', async () => {
    mockIssueDetail()
    const user = userEvent.setup()
    const { router } = renderWithProviders(<BoardPage />, { route: '/board', path: '/board' })

    await user.click(await screen.findByRole('button', { name: /URK-3 — ვიზუალიზაცია/ }))

    expect(router.state.location.search).toBe('?issue=3')
    expect(await screen.findByText('Comments')).toBeInTheDocument()
    expect(screen.getByLabelText('Change status')).toHaveValue('todo')
  })

  it('hides create buttons without issues.create', async () => {
    renderWithProviders(<BoardPage />, { route: '/board', path: '/board', store: authedStore(['issues.view', 'projects.view']) })

    await screen.findByRole('region', { name: 'In progress — 1' })
    expect(screen.queryByRole('button', { name: /Add task/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New task' })).not.toBeInTheDocument()
  })

  it('sends the project filter to the board query', async () => {
    let requested = ''
    server.use(
      http.get(`${API}/issues/board`, ({ request }) => {
        requested = new URL(request.url).search
        return HttpResponse.json({ data: { todo: [], progress: [], review: [], blocked: [], done: [] } })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BoardPage />, { route: '/board', path: '/board' })

    const select = await screen.findByLabelText('Project')
    await screen.findByRole('option', { name: /OFF/ })
    await user.selectOptions(select, '2')

    await expect.poll(() => requested).toContain('project_id=2')
  })
})
