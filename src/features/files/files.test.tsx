import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import FilesPage from '@/pages/FilesPage'
import { paginated, users } from '@/test/msw/fixtures'
import { API } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'
import { authedStore, renderWithProviders } from '@/test/render'
import type { ProjectFile } from '@/types/api'

import { validateFiles } from './validate'

const limits = { max_kb: 1, max_files: 10, extensions: ['pdf', 'png'] }

describe('validateFiles', () => {
  it('flags disallowed types and oversize files', () => {
    const problems = validateFiles(
      [new File(['x'], 'ok.pdf'), new File(['x'], 'virus.exe'), new File([new Uint8Array(2048)], 'big.png')],
      limits,
    )
    expect(problems).toEqual([
      { name: 'virus.exe', kind: 'fileType' },
      { name: 'big.png', kind: 'fileTooLarge' },
    ])
  })
})

const file = (over: Partial<ProjectFile>): ProjectFile => ({
  id: 1,
  original_name: 'ფინანსური კალკულატორი.pdf',
  mime: 'application/pdf',
  size_bytes: 2048,
  type: 'pdf',
  project: { id: 1, key: 'URK', name: 'House' },
  uploader: users.finance,
  download_url: '/api/v1/files/1/download',
  preview_url: null,
  can_delete: false,
  created_at: '2026-10-20T10:00:00+00:00',
  ...over,
})

describe('FilesPage', () => {
  it('shows file cards with delete only where allowed', async () => {
    server.use(
      http.get(`${API}/files`, () =>
        HttpResponse.json(paginated([file({}), file({ id: 2, original_name: 'plan.dwg', type: 'dwg', can_delete: true })])),
      ),
    )
    renderWithProviders(<FilesPage />)

    expect(await screen.findByText('ფინანსური კალკულატორი.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete “plan.dwg”' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete “ფინანსური კალკულატორი.pdf”' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download “plan.dwg”' })).toBeInTheDocument()
  })

  it('reads ?search= into the filter and hides upload without files.upload', async () => {
    let lastUrl = ''
    server.use(
      http.get(`${API}/files`, ({ request }) => {
        lastUrl = request.url
        return HttpResponse.json(paginated([]))
      }),
    )
    renderWithProviders(<FilesPage />, { store: authedStore(['files.view', 'projects.view']), route: '/files?search=moodboard' })

    expect(await screen.findByText('No files')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search by file name' })).toHaveValue('moodboard')
    expect(lastUrl).toContain('search=moodboard')
    expect(screen.queryByText('Upload files')).not.toBeInTheDocument()
  })

  it('rejects disallowed files before uploading', async () => {
    server.use(http.get(`${API}/files`, () => HttpResponse.json(paginated([]))))
    renderWithProviders(<FilesPage />)

    const input = await screen.findByLabelText('browse your computer')
    await userEvent.upload(input, new File(['x'], 'virus.exe'), { applyAccept: false })

    expect(await screen.findByRole('alert')).toHaveTextContent('“virus.exe” — this file type isn\'t allowed')
  })
})
