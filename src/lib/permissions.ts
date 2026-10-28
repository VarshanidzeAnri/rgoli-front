/**
 * Permission catalog. Must match rgoli-api/resources/permissions.json
 * (verified by `npm run check:permissions`).
 */
export const PERMISSION_GROUPS = {
  projects: [
    'projects.view',
    'projects.view_all',
    'projects.create',
    'projects.update',
    'projects.delete',
    'projects.manage_members',
    'phases.manage',
  ],
  issues: ['issues.view', 'issues.create', 'issues.update', 'issues.move', 'issues.delete', 'issues.comment', 'sprints.manage'],
  files: ['files.view', 'files.upload', 'files.delete_own', 'files.delete_any'],
  map: ['map.view', 'locations.update'],
  finance: ['finance.view', 'client_payments.manage', 'salary.request', 'salary.approve'],
  reports: ['reports.view', 'reports.export'],
  admin: ['users.view', 'users.manage', 'roles.manage', 'system.export', 'system.reset_demo'],
} as const

export type PermissionGroup = keyof typeof PERMISSION_GROUPS
export type Permission = (typeof PERMISSION_GROUPS)[PermissionGroup][number]

export const PERMISSION_GROUP_KEYS = Object.keys(PERMISSION_GROUPS) as PermissionGroup[]

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_GROUP_KEYS.flatMap((g) => PERMISSION_GROUPS[g])

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS)

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

/** Translation key inside permissions.json for a permission ("projects.view" → names.projects.view). */
export function permissionLabelKey(permission: Permission): `names.${Permission}` {
  return `names.${permission}`
}
