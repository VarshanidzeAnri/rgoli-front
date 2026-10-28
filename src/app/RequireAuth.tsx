import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { LogoMark } from '@/components/kit'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchMe, selectAuthStatus } from '@/store/authSlice'

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy>
      <LogoMark className="size-14 animate-pulse" />
    </div>
  )
}

/** Loads /me for a stored token; sends guests to /login (remembering where they were going). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectAuthStatus)
  const location = useLocation()

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchMe())
  }, [status, dispatch])

  if (status === 'idle' || status === 'loading') return <Splash />
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

/** Login/forgot pages: already signed-in users go straight to the app. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const status = useAppSelector(selectAuthStatus)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchMe())
  }, [status, dispatch])

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  if (status === 'idle' || status === 'loading') return <Splash />
  return children
}
