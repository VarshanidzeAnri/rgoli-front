import enAdmin from './locales/en/admin.json'
import enAuth from './locales/en/auth.json'
import enBacklog from './locales/en/backlog.json'
import enBoard from './locales/en/board.json'
import enCalendar from './locales/en/calendar.json'
import enCommon from './locales/en/common.json'
import enDashboard from './locales/en/dashboard.json'
import enEnums from './locales/en/enums.json'
import enFiles from './locales/en/files.json'
import enFinance from './locales/en/finance.json'
import enMap from './locales/en/map.json'
import enNav from './locales/en/nav.json'
import enPermissions from './locales/en/permissions.json'
import enProfile from './locales/en/profile.json'
import enProjects from './locales/en/projects.json'
import enReports from './locales/en/reports.json'
import enTimeline from './locales/en/timeline.json'
import enValidation from './locales/en/validation.json'
import kaAdmin from './locales/ka/admin.json'
import kaAuth from './locales/ka/auth.json'
import kaBacklog from './locales/ka/backlog.json'
import kaBoard from './locales/ka/board.json'
import kaCalendar from './locales/ka/calendar.json'
import kaCommon from './locales/ka/common.json'
import kaDashboard from './locales/ka/dashboard.json'
import kaEnums from './locales/ka/enums.json'
import kaFiles from './locales/ka/files.json'
import kaFinance from './locales/ka/finance.json'
import kaMap from './locales/ka/map.json'
import kaNav from './locales/ka/nav.json'
import kaPermissions from './locales/ka/permissions.json'
import kaProfile from './locales/ka/profile.json'
import kaProjects from './locales/ka/projects.json'
import kaReports from './locales/ka/reports.json'
import kaTimeline from './locales/ka/timeline.json'
import kaValidation from './locales/ka/validation.json'
import ruAdmin from './locales/ru/admin.json'
import ruAuth from './locales/ru/auth.json'
import ruBacklog from './locales/ru/backlog.json'
import ruBoard from './locales/ru/board.json'
import ruCalendar from './locales/ru/calendar.json'
import ruCommon from './locales/ru/common.json'
import ruDashboard from './locales/ru/dashboard.json'
import ruEnums from './locales/ru/enums.json'
import ruFiles from './locales/ru/files.json'
import ruFinance from './locales/ru/finance.json'
import ruMap from './locales/ru/map.json'
import ruNav from './locales/ru/nav.json'
import ruPermissions from './locales/ru/permissions.json'
import ruProfile from './locales/ru/profile.json'
import ruProjects from './locales/ru/projects.json'
import ruReports from './locales/ru/reports.json'
import ruTimeline from './locales/ru/timeline.json'
import ruValidation from './locales/ru/validation.json'

/** Georgian is the source of truth for keys (see i18next.d.ts and scripts/check-i18n-keys.ts). */
export const ka = {
  common: kaCommon,
  auth: kaAuth,
  nav: kaNav,
  dashboard: kaDashboard,
  projects: kaProjects,
  board: kaBoard,
  backlog: kaBacklog,
  timeline: kaTimeline,
  calendar: kaCalendar,
  map: kaMap,
  files: kaFiles,
  finance: kaFinance,
  reports: kaReports,
  admin: kaAdmin,
  profile: kaProfile,
  permissions: kaPermissions,
  validation: kaValidation,
  enums: kaEnums,
} as const

export const en = {
  common: enCommon,
  auth: enAuth,
  nav: enNav,
  dashboard: enDashboard,
  projects: enProjects,
  board: enBoard,
  backlog: enBacklog,
  timeline: enTimeline,
  calendar: enCalendar,
  map: enMap,
  files: enFiles,
  finance: enFinance,
  reports: enReports,
  admin: enAdmin,
  profile: enProfile,
  permissions: enPermissions,
  validation: enValidation,
  enums: enEnums,
} as const

export const ru = {
  common: ruCommon,
  auth: ruAuth,
  nav: ruNav,
  dashboard: ruDashboard,
  projects: ruProjects,
  board: ruBoard,
  backlog: ruBacklog,
  timeline: ruTimeline,
  calendar: ruCalendar,
  map: ruMap,
  files: ruFiles,
  finance: ruFinance,
  reports: ruReports,
  admin: ruAdmin,
  profile: ruProfile,
  permissions: ruPermissions,
  validation: ruValidation,
  enums: ruEnums,
} as const

export const resources = { ka, en, ru } as const
export const NAMESPACES = Object.keys(ka) as (keyof typeof ka)[]
export type Namespace = (typeof NAMESPACES)[number]
