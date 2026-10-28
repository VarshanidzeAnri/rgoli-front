import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { RoleRef } from '@/types/api'

export const SYSTEM_ROLE_SLUGS = ['owner', 'project_manager', 'architect', 'interior_designer', 'finance_manager', 'member'] as const
export type SystemRoleSlug = (typeof SYSTEM_ROLE_SLUGS)[number]

export function isSystemRoleSlug(slug: string | null | undefined): slug is SystemRoleSlug {
  return typeof slug === 'string' && (SYSTEM_ROLE_SLUGS as readonly string[]).includes(slug)
}

/**
 * Display name of a role: seeded roles keep their original name translated
 * (unless an admin renamed them); custom roles show their name as entered.
 */
export function useRoleLabel() {
  const { t } = useTranslation('permissions')
  return useCallback(
    (role: Pick<RoleRef, 'slug' | 'name'>): string => {
      if (!isSystemRoleSlug(role.slug)) return role.name
      const english = t(`roles.${role.slug}`, { lng: 'en' })
      // Renamed system role: show the custom name.
      return role.name === english ? t(`roles.${role.slug}`) : role.name
    },
    [t],
  )
}
