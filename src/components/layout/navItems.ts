import {
  BanknoteIcon,
  CalendarDaysIcon,
  ChartColumnIcon,
  FolderKanbanIcon,
  FolderOpenIcon,
  GanttChartIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  MapIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import type { Permission } from '@/lib/permissions'

export interface NavItem {
  to: string
  label:
    | 'dashboard'
    | 'projects'
    | 'board'
    | 'backlog'
    | 'timeline'
    | 'calendar'
    | 'map'
    | 'files'
    | 'finance'
    | 'reports'
    | 'users'
    | 'roles'
  icon: LucideIcon
  /** Shown when the user has any of these. */
  permission: Permission | readonly Permission[]
  group: 'navigation' | 'management'
}

/** Single source for sidebar items and route guards. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'dashboard', icon: LayoutDashboardIcon, permission: 'projects.view', group: 'navigation' },
  { to: '/projects', label: 'projects', icon: FolderKanbanIcon, permission: 'projects.view', group: 'navigation' },
  { to: '/board', label: 'board', icon: KanbanSquareIcon, permission: 'issues.view', group: 'navigation' },
  { to: '/backlog', label: 'backlog', icon: ListTodoIcon, permission: 'issues.view', group: 'navigation' },
  { to: '/timeline', label: 'timeline', icon: GanttChartIcon, permission: 'projects.view', group: 'navigation' },
  { to: '/calendar', label: 'calendar', icon: CalendarDaysIcon, permission: 'projects.view', group: 'navigation' },
  { to: '/map', label: 'map', icon: MapIcon, permission: 'map.view', group: 'navigation' },
  { to: '/files', label: 'files', icon: FolderOpenIcon, permission: 'files.view', group: 'management' },
  { to: '/finance', label: 'finance', icon: BanknoteIcon, permission: ['finance.view', 'salary.request'], group: 'management' },
  { to: '/reports', label: 'reports', icon: ChartColumnIcon, permission: 'reports.view', group: 'management' },
  { to: '/admin/users', label: 'users', icon: UsersIcon, permission: 'users.view', group: 'management' },
  { to: '/admin/roles', label: 'roles', icon: ShieldCheckIcon, permission: 'roles.manage', group: 'management' },
]
