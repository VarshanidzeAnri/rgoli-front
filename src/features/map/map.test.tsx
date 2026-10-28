import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import MapPage from '@/pages/MapPage'
import { projects } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'

import { googleEmbedUrl, locatedProjects, toRadarPins } from './projection'

describe('projection', () => {
  it('numbers projects in list order and skips ones without coordinates', () => {
    const items = locatedProjects([{ ...projects[0]!, lat: null, lng: null }, projects[1]!])
    expect(items).toHaveLength(1)
    expect(items[0]?.number).toBe(2)
  })

  it('normalises pins inside the padded square', () => {
    const pins = toRadarPins(locatedProjects(projects))
    for (const pin of pins) {
      expect(pin.x).toBeGreaterThanOrEqual(0.14)
      expect(pin.x).toBeLessThanOrEqual(0.86)
      expect(pin.y).toBeGreaterThanOrEqual(0.14)
      expect(pin.y).toBeLessThanOrEqual(0.86)
    }
    // URK is further north than OFF → smaller y.
    expect(pins[0]!.y).toBeLessThan(pins[1]!.y)
  })

  it('centres a single pin', () => {
    expect(toRadarPins(locatedProjects([projects[0]!]))[0]).toMatchObject({ x: 0.5, y: 0.5 })
  })

  it('builds the Google embed url', () => {
    expect(googleEmbedUrl(41.6, 41.63)).toBe('https://maps.google.com/maps?q=41.6,41.63&z=15&output=embed')
  })
})

describe('MapPage', () => {
  const useMapData = () => server.use(http.get(`${API}/map/projects`, () => HttpResponse.json({ data: projects })))

  it('lists projects and selects one from the radar', async () => {
    useMapData()
    const { store } = renderWithProviders(<MapPage />)

    const radar = await screen.findByRole('group', { name: 'Project radar' })
    await userEvent.click(within(radar).getByRole('button', { name: `2. ${projects[1]!.name}` }))

    expect(store.getState().ui.map.selectedProjectId).toBe(2)
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', 'https://www.google.com/maps?q=41.6461,41.6405')
  })

  it('hides location editing without locations.update', async () => {
    useMapData()
    renderWithProviders(<MapPage />, { store: authedStore(['projects.view', 'map.view']) })

    expect(await screen.findByText(projects[0]!.name)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit location' })).not.toBeInTheDocument()
  })

  it('switches to the Google embed mode', async () => {
    useMapData()
    renderWithProviders(<MapPage />)
    await userEvent.click(await screen.findByRole('radio', { name: 'Google Maps' }))
    expect(screen.getByTitle(`Google map — ${projects[0]!.name}`)).toHaveAttribute('src', expect.stringContaining('output=embed'))
  })
})
