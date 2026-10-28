import { useAppSelector } from '@/store'
import { selectPermissionSet } from '@/store/authSlice'
import type { Permission } from '@/lib/permissions'

/**
 * True when the user has the permission. For a list, `mode: 'any'` (default) or `'all'`.
 * UI only hides things — the API is the source of truth.
 */
export function useCan(permission: Permission | readonly Permission[], mode: 'any' | 'all' = 'any'): boolean {
  const set = useAppSelector(selectPermissionSet)
  if (typeof permission === 'string') return set.has(permission)
  return mode === 'all' ? permission.every((p) => set.has(p)) : permission.some((p) => set.has(p))
}
