import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { ErrorState } from '@/components/kit'
import { Button } from '@/components/ui/button'

function Fallback({ onReset }: { onReset?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="glass mx-auto my-16 max-w-lg p-6 text-center">
      <h1 className="text-lg font-semibold">{t('errors.boundaryTitle')}</h1>
      <ErrorState message={t('errors.boundaryText')} onRetry={onReset ?? (() => window.location.reload())} />
      <Button asChild variant="link">
        <a href="/dashboard">{t('errors.goHome')}</a>
      </Button>
    </div>
  )
}

/** App-wide boundary for render errors outside the router. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  override render() {
    return this.state.error ? <Fallback onReset={() => this.setState({ error: null })} /> : this.props.children
  }
}

/** Per-route error element (loader/render errors inside a route). */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <Fallback />
  console.error(error)
  return <Fallback />
}
