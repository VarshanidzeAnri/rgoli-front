import { http, HttpResponse } from 'msw'

import { issues, me, paginated, projects } from './fixtures'

export const API = '/api/v1'

/** Default happy-path API. Tests override per case with server.use(...). */
export const handlers = [
  http.get(`${API}/config`, () =>
    HttpResponse.json({ data: { version: 'v5', demo: true, uploads: { max_kb: 51200, max_files: 10, extensions: ['pdf', 'png', 'zip', 'dwg'] } } }),
  ),
  http.get(`${API}/public/stats`, () => HttpResponse.json({ data: { active_projects: 3, open_tasks: 4, team_members: 4 } })),
  http.get(`${API}/auth/demo-accounts`, () =>
    HttpResponse.json({ data: [{ email: 'admin@rgoli.ge', password: 'admin123', role: 'owner' }] }),
  ),
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.password !== 'admin123') {
      return HttpResponse.json({ message: 'Wrong email or password', errors: { email: ['Wrong email or password'] } }, { status: 422 })
    }
    return HttpResponse.json({ data: { token: '1|test-token', token_type: 'Bearer', ...me() } })
  }),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API}/me`, ({ request }) =>
    request.headers.get('Authorization') ? HttpResponse.json({ data: me() }) : HttpResponse.json({ message: 'Please sign in.' }, { status: 401 }),
  ),
  http.get(`${API}/projects`, () =>
    HttpResponse.json(paginated(projects, { status_counts: { todo: 0, progress: 1, review: 1, blocked: 0, done: 0 } })),
  ),
  http.get(`${API}/projects/:id`, ({ params }) => {
    const project = projects.find((p) => p.id === Number(params.id))
    return project ? HttpResponse.json({ data: project }) : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),
  http.get(`${API}/issues/board`, () =>
    HttpResponse.json({
      data: {
        todo: issues.filter((i) => i.status === 'todo'),
        progress: issues.filter((i) => i.status === 'progress'),
        review: [],
        blocked: [],
        done: issues.filter((i) => i.status === 'done'),
      },
    }),
  ),
  http.get(`${API}/issues`, () => HttpResponse.json(paginated(issues))),
  http.get(`${API}/notifications`, () => HttpResponse.json(paginated([], { unread: 0 }))),
  http.get(`${API}/people`, () => HttpResponse.json({ data: [] })),
  http.get(`${API}/search`, () => HttpResponse.json({ data: { projects: [], issues: [], files: [] } })),
]
