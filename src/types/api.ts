/**
 * Types that mirror the Laravel API Resources (rgoli-api/app/Http/Resources).
 * Money is always a decimal string ("13800.00"); dates are "YYYY-MM-DD"; timestamps ISO 8601.
 */
import type {
  Discipline,
  FileType,
  PaymentMethod,
  PaymentStatus,
  Priority,
  SprintState,
  Status,
} from '@/lib/enums'
import type { Permission, PermissionGroup } from '@/lib/permissions'

export type Money = string
export type IsoDate = string
export type IsoDateTime = string

// ── Envelopes ───────────────────────────────────────────────────────────
export interface DataResponse<T> {
  data: T
  meta?: { message?: string }
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Paginated<T, M = object> {
  data: T[]
  meta: PaginationMeta & M
}

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}

// ── Users & auth ────────────────────────────────────────────────────────
export interface UserSummary {
  id: number
  name: string
  job_title: string | null
  avatar_url: string | null
  is_active: boolean
}

export interface RoleRef {
  id: number
  slug: string | null
  name: string
}

export interface Me {
  user: UserSummary & { email: string }
  roles: RoleRef[]
  permissions: Permission[]
  disciplines: Discipline[]
}

export interface LoginResult extends Me {
  token: string
  token_type: 'Bearer'
}

export interface AdminUser extends UserSummary {
  email: string
  roles: RoleRef[]
  direct_permissions: Permission[]
  permissions: Permission[]
  disciplines: Discipline[]
  created_at: IsoDateTime | null
}

export interface Role extends RoleRef {
  is_system: boolean
  is_owner: boolean
  permissions: Permission[]
  users_count?: number
}

export type PermissionCatalog = Record<PermissionGroup, Permission[]>

export interface DemoAccount {
  email: string
  password: string
  role: string
}

export interface AppConfig {
  version: string
  demo: boolean
  uploads: { max_kb: number; max_files: number; extensions: string[] }
}

export interface PublicStats {
  active_projects: number
  open_tasks: number
  team_members: number
}

// ── Projects ────────────────────────────────────────────────────────────
export interface ProjectRef {
  id: number
  key: string
  name: string
}

export interface Phase {
  id: number
  project_id: number
  name: string
  order: number
  start_date: IsoDate | null
  end_date: IsoDate | null
  status: Status
}

export interface ProjectFinance {
  budget: Money
  discount_price: Money | null
  agreed_price: Money
  paid: Money
  remaining: Money
}

export interface Project extends ProjectRef {
  client_name: string
  client_phone: string | null
  client_email: string | null
  address: string | null
  discipline: Discipline
  status: Status
  progress: number
  start_date: IsoDate | null
  end_date: IsoDate | null
  description: string | null
  lat: number | null
  lng: number | null
  current_phase?: { id: number; name: string } | null
  phases?: Phase[]
  members?: UserSummary[]
  tasks?: { total: number; done: number }
  /** null without finance.view */
  finance: ProjectFinance | null
  created_at: IsoDateTime | null
  updated_at: IsoDateTime | null
}

export type StatusCounts = Record<Status, number>

// ── Issues ──────────────────────────────────────────────────────────────
export interface Issue {
  id: number
  key: string
  number: number
  project: ProjectRef
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: IsoDate | null
  points: number
  position: number
  assignees?: UserSummary[]
  sprint_id?: number | null
  comments_count?: number
  created_at: IsoDateTime | null
  updated_at: IsoDateTime | null
}

export type Board = Record<Status, Issue[]>

export interface Comment {
  id: number
  issue_id: number
  body: string
  user?: UserSummary
  can_edit: boolean
  created_at: IsoDateTime | null
  updated_at: IsoDateTime | null
}

export interface Sprint {
  id: number
  name: string
  goal: string | null
  start_date: IsoDate
  end_date: IsoDate
  state: SprintState
  started_at: IsoDateTime | null
  completed_at: IsoDateTime | null
  issues?: Issue[]
  stats?: { total: number; done: number; points_total: number; points_done: number }
}

// ── Files ───────────────────────────────────────────────────────────────
export interface ProjectFile {
  id: number
  original_name: string
  mime: string
  size_bytes: number
  type: FileType
  project: ProjectRef
  uploader?: UserSummary
  download_url: string
  preview_url: string | null
  can_delete: boolean
  created_at: IsoDateTime | null
}

// ── Finance ─────────────────────────────────────────────────────────────
export interface ClientPayment {
  id: number
  project?: ProjectRef
  project_id: number
  amount: Money
  paid_at: IsoDate
  method: PaymentMethod
  note: string | null
  recorder?: UserSummary
  created_at: IsoDateTime | null
}

export interface SalaryRequest {
  id: number
  project: ProjectRef
  user?: UserSummary
  title: string
  amount: Money
  note: string | null
  status: PaymentStatus
  decider?: UserSummary
  decided_at: IsoDateTime | null
  decision_note: string | null
  can: { decide: boolean; update: boolean }
  created_at: IsoDateTime | null
}

export interface FinanceProjectRow {
  project: ProjectRef & { status: Status }
  budget: Money
  discount_price: Money | null
  agreed_price: Money
  paid: Money
  remaining: Money
}

export interface FinanceSummary {
  total_budget: Money
  paid_by_clients: Money
  paid_percent: number
  remaining: Money
  approved_salaries: Money
  pending_requests: number
  pending_amount: Money
  payments_this_month: Money
  projects: FinanceProjectRow[]
}

// ── Workspace ───────────────────────────────────────────────────────────
export interface Activity {
  id: number
  event: 'created' | 'updated' | 'deleted' | 'moved' | (string & {})
  subject_type: 'project' | 'phase' | 'issue' | 'sprint' | 'comment' | 'file' | 'client_payment' | 'salary_request' | (string & {})
  subject_id: number
  meta: { label?: string; fields?: string[]; from?: Record<string, unknown>; to?: Record<string, unknown> }
  user?: UserSummary
  project?: ProjectRef | null
  created_at: IsoDateTime
}

export interface WorkloadRow {
  user: UserSummary
  open_count: number
  open_points: number
  load_percent: number
}

export interface Dashboard {
  kpis: {
    active_projects: number
    open_tasks: number
    critical_tasks: number
    budget: { total: Money; paid: Money; remaining: Money } | null
    pending_salary_requests: number
  }
  project_status_distribution: StatusCounts
  projects: Project[]
  activity: Activity[]
  workload: WorkloadRow[]
  my_tasks_this_week: Issue[]
  team_size: number
}

export interface CalendarEvent {
  type: 'task' | 'milestone'
  id: number
  date: IsoDate
  title: string
  key: string
  status: Status
  priority: Priority | null
  project_id: number
}

export interface SearchResults {
  projects: { id: number; key: string; name: string; client_name: string; status: Status }[]
  issues: { id: number; key: string; title: string; status: Status; project: string }[]
  files: { id: number; name: string; type: FileType; project: string }[]
}

export interface AppNotification {
  id: string
  kind: string
  params: Record<string, string | number | null>
  message: string
  link: string | null
  read_at: IsoDateTime | null
  created_at: IsoDateTime | null
}

export interface ReportSummary {
  task_completion_percent: number
  average_progress: number
  outstanding_budget: Money | null
  task_status: StatusCounts
  planned_vs_paid: { project: string; name: string; planned: Money; paid: Money }[]
  workload: WorkloadRow[]
}

export interface SystemStats {
  users: number
  active_users: number
  projects: number
  issues: number
  files: number
  storage_bytes: number
  client_payments: number
  salary_requests: number
  activity_logs: number
  demo: boolean
}
