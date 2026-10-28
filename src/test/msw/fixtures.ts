import { ALL_PERMISSIONS, type Permission } from '@/lib/permissions'
import type { Issue, Me, Project, UserSummary } from '@/types/api'

export const users: Record<'admin' | 'designer' | 'manager' | 'finance', UserSummary> = {
  admin: { id: 1, name: 'Admin', job_title: 'Studio Owner', avatar_url: null, is_active: true },
  designer: { id: 2, name: 'Interior Designer', job_title: 'Interior Designer', avatar_url: null, is_active: true },
  finance: { id: 3, name: 'Finance Manager', job_title: 'Finance Manager', avatar_url: null, is_active: true },
  manager: { id: 4, name: 'Project Manager', job_title: 'Project Manager', avatar_url: null, is_active: true },
}

export function me(permissions: readonly Permission[] = ALL_PERMISSIONS, user: UserSummary = users.admin): Me {
  return {
    user: { ...user, email: `${user.name.toLowerCase().replace(/\s/g, '.')}@rgoli.ge` },
    roles: [{ id: 1, slug: permissions.length === ALL_PERMISSIONS.length ? 'owner' : 'member', name: 'Role' }],
    permissions: [...permissions],
    disciplines: ['architecture'],
  }
}

export const projects: Project[] = [
  {
    id: 1,
    key: 'URK',
    name: 'ინდივიდუალური საცხოვრებელი სახლი',
    client_name: 'შოთა ფალავანდიშვილი',
    client_phone: null,
    client_email: null,
    address: 'ქალაქი ბათუმი, ურეხის დასახლება #35',
    discipline: 'architecture',
    status: 'progress',
    progress: 42,
    start_date: '2026-10-18',
    end_date: '2027-01-01',
    description: null,
    lat: 41.651,
    lng: 41.6367,
    current_phase: { id: 2, name: 'ფაზა 2 — არქიტექტურული პროექტირება' },
    members: [users.admin, users.designer, users.manager],
    tasks: { total: 3, done: 1 },
    finance: { budget: '13800.00', discount_price: '9960.00', agreed_price: '9960.00', paid: '3500.00', remaining: '6460.00' },
    created_at: '2026-10-18T10:00:00+00:00',
    updated_at: '2026-10-18T10:00:00+00:00',
  },
  {
    id: 2,
    key: 'OFF',
    name: 'RGOLI Office Interior',
    client_name: 'RGOLI',
    client_phone: null,
    client_email: null,
    address: 'Batumi, Rustaveli Ave',
    discipline: 'interior',
    status: 'review',
    progress: 68,
    start_date: '2026-10-03',
    end_date: '2026-11-22',
    description: null,
    lat: 41.6461,
    lng: 41.6405,
    current_phase: { id: 5, name: 'Interior design review' },
    members: [users.admin, users.designer],
    tasks: { total: 1, done: 0 },
    finance: null,
    created_at: '2026-10-03T10:00:00+00:00',
    updated_at: '2026-10-03T10:00:00+00:00',
  },
]

function issue(id: number, title: string, status: Issue['status'], priority: Issue['priority'], assignee: UserSummary, due: string, points: number, position: number): Issue {
  return {
    id,
    key: `URK-${id}`,
    number: id,
    project: { id: 1, key: 'URK', name: projects[0]?.name ?? '' },
    title,
    description: null,
    status,
    priority,
    due_date: due,
    points,
    position,
    assignees: [assignee],
    sprint_id: null,
    comments_count: 0,
    created_at: '2026-10-20T10:00:00+00:00',
    updated_at: '2026-10-20T10:00:00+00:00',
  }
}

export const issues: Issue[] = [
  issue(1, 'მუნიციპალიტეტთან კონსულტაცია', 'done', 'high', users.manager, '2026-10-26', 3, 0),
  issue(2, 'ტოპოგრაფიული გეგმის მომზადება', 'progress', 'critical', users.manager, '2026-11-01', 8, 0),
  issue(3, 'ვიზუალიზაცია / რენდერი', 'todo', 'medium', users.designer, '2026-11-07', 5, 0),
]

export function paginated<T>(data: T[], extra: object = {}) {
  return {
    data,
    meta: { current_page: 1, last_page: 1, per_page: 25, total: data.length, from: data.length ? 1 : null, to: data.length, ...extra },
  }
}
