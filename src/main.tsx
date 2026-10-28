import '@/styles/globals.css'
import 'leaflet/dist/leaflet.css'
import '@/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { ErrorBoundary } from '@/app/ErrorBoundary'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'

const root = document.getElementById('root')
if (!root) throw new Error('#root element is missing')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
