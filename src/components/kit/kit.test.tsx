import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { authedStore, renderWithProviders } from '@/test/render'

import { Can } from './Can'
import { ProgressBar } from './ProgressBar'
import { PriorityPill, StatusPill } from './Pill'
import { UserAvatar } from './UserAvatar'

describe('<Can>', () => {
  it('renders children only with the permission', async () => {
    renderWithProviders(
      <>
        <Can permission="projects.create">
          <span>create-button</span>
        </Can>
        <Can permission="finance.view" fallback={<span>no-finance</span>}>
          <span>finance</span>
        </Can>
      </>,
      { store: authedStore(['projects.view', 'projects.create']) },
    )

    expect(await screen.findByText('create-button')).toBeInTheDocument()
    expect(screen.queryByText('finance')).not.toBeInTheDocument()
    expect(screen.getByText('no-finance')).toBeInTheDocument()
  })
})

describe('pills', () => {
  it('translates enum labels', async () => {
    renderWithProviders(
      <>
        <StatusPill status="progress" />
        <PriorityPill priority="critical" />
      </>,
    )
    expect(await screen.findByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('clamps and exposes the value to assistive tech', async () => {
    renderWithProviders(<ProgressBar value={140} label="Progress" />)
    expect(await screen.findByRole('progressbar', { name: 'Progress' })).toHaveAttribute('aria-valuenow', '100')
  })
})

describe('UserAvatar', () => {
  it('shows the initial with an accessible name', async () => {
    renderWithProviders(<UserAvatar user={{ name: 'nino', avatar_url: null }} />)
    expect(await screen.findByRole('img', { name: "nino's avatar" })).toHaveTextContent('N')
  })
})
