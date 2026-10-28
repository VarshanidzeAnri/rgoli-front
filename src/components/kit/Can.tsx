import { type ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useCan } from '@/hooks/useCan'
import type { Permission } from '@/lib/permissions'

/** Renders children only with the permission (any of a list). Hides UI; the API still enforces. */
export function Can({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: {
  permission: Permission | readonly Permission[]
  mode?: 'any' | 'all'
  fallback?: ReactNode
  children: ReactNode
}) {
  return useCan(permission, mode) ? children : fallback
}

/** Route guard: sends users without the permission to /403. */
export function RequirePermission({ permission, children }: { permission: Permission | readonly Permission[]; children: ReactNode }) {
  return useCan(permission) ? children : <Navigate to="/403" replace />
}
