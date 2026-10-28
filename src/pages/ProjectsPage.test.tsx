import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { paginated, projects } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'

import ProjectsPage from './ProjectsPage'

describe('ProjectsPage', () => {
  it('lists projects with status chip counts', async () => {
    renderWithProviders(<ProjectsPage />)

    expect((await screen.findAllByText('RGOLI Office Interior')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /All\s*2/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Review\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument()
  })

  it('sends status, discipline and search filters to the API', async () => {
    const urls: URL[] = []
    server.use(
      http.get(`${API}/projects`, ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(paginated(projects.slice(1), { status_counts: { todo: 0, progress: 1, review: 1, blocked: 0, done: 0 } }))
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<ProjectsPage />)

    await user.click(await screen.findByRole('button', { name: /Review\s*1/ }))
    await user.click(screen.getByRole('combobox', { name: 'Discipline filter' }))
    await user.click(await screen.findByRole('option', { name: 'Interior' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search projects' }), 'Office')

    await waitFor(() => {
      const last = urls.at(-1)
      expect(last?.searchParams.get('status')).toBe('review')
      expect(last?.searchParams.get('discipline')).toBe('interior')
      expect(last?.searchParams.get('search')).toBe('Office')
    })
  })

  it('shows an empty state and hides "New project" without permission', async () => {
    server.use(
      http.get(`${API}/projects`, () =>
        HttpResponse.json(paginated([], { status_counts: { todo: 0, progress: 0, review: 0, blocked: 0, done: 0 } })),
      ),
    )
    renderWithProviders(<ProjectsPage />, { store: authedStore(['projects.view']) })

    expect(await screen.findByText('No projects found')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New project' })).not.toBeInTheDocument()
  })
})
