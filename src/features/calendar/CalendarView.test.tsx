import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { toIsoDate } from '@/lib/format'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import { CalendarView } from './CalendarView'

describe('CalendarView', () => {
  it('shows task deadlines and milestones, with overflow', async () => {
    const today = toIsoDate(new Date())
    server.use(
      http.get(`${API}/calendar`, () =>
        HttpResponse.json({
          data: [
            { type: 'milestone', id: 9, date: today, title: 'Office handover', key: 'OFF', status: 'review', priority: null, project_id: 2 },
            { type: 'task', id: 1, date: today, title: 'Task one', key: 'URK-1', status: 'todo', priority: 'high', project_id: 1 },
            { type: 'task', id: 2, date: today, title: 'Task two', key: 'URK-2', status: 'todo', priority: 'low', project_id: 1 },
          ],
        }),
      ),
    )
    renderWithProviders(<CalendarView />)

    expect((await screen.findAllByRole('link', { name: 'Office handover' }))[0]).toHaveAttribute('href', '/projects/2')
    expect(screen.getByRole('button', { name: '1 more events' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(screen.getByRole('heading', { name: 'Upcoming' })).toBeInTheDocument()
  })
})
