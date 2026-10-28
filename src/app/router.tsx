import { lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'

import { RequirePermission } from '@/components/kit'
import { AppShell } from '@/components/layout/AppShell'
import type { Permission } from '@/lib/permissions'
import ForbiddenPage from '@/pages/ForbiddenPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

import { RouteError } from './ErrorBoundary'
import { GuestOnly, RequireAuth } from './RequireAuth'

// Route-level code splitting (Reports and Map pull in charts/leaflet).
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const BoardPage = lazy(() => import('@/pages/BoardPage'))
const BacklogPage = lazy(() => import('@/pages/BacklogPage'))
const TimelinePage = lazy(() => import('@/pages/TimelinePage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const MapPage = lazy(() => import('@/pages/MapPage'))
const FilesPage = lazy(() => import('@/pages/FilesPage'))
const FinancePage = lazy(() => import('@/pages/FinancePage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const RolesPage = lazy(() => import('@/pages/RolesPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

function guard(permission: Permission | readonly Permission[], element: ReactNode) {
  return <RequirePermission permission={permission}>{element}</RequirePermission>
}

export const routes = [
  { path: '/login', element: <GuestOnly><LoginPage /></GuestOnly>, errorElement: <RouteError /> },
  { path: '/forgot-password', element: <GuestOnly><ForgotPasswordPage /></GuestOnly>, errorElement: <RouteError /> },
  { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <RouteError /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: guard('projects.view', <DashboardPage />), errorElement: <RouteError /> },
      { path: 'projects', element: guard('projects.view', <ProjectsPage />), errorElement: <RouteError /> },
      { path: 'projects/:id', element: guard('projects.view', <ProjectDetailPage />), errorElement: <RouteError /> },
      { path: 'board', element: guard('issues.view', <BoardPage />), errorElement: <RouteError /> },
      { path: 'backlog', element: guard('issues.view', <BacklogPage />), errorElement: <RouteError /> },
      { path: 'timeline', element: guard('projects.view', <TimelinePage />), errorElement: <RouteError /> },
      { path: 'calendar', element: guard('projects.view', <CalendarPage />), errorElement: <RouteError /> },
      { path: 'map', element: guard('map.view', <MapPage />), errorElement: <RouteError /> },
      { path: 'files', element: guard('files.view', <FilesPage />), errorElement: <RouteError /> },
      { path: 'finance', element: guard(['finance.view', 'salary.request'], <FinancePage />), errorElement: <RouteError /> },
      { path: 'reports', element: guard('reports.view', <ReportsPage />), errorElement: <RouteError /> },
      { path: 'admin', element: <Navigate to="/admin/users" replace /> },
      { path: 'admin/users', element: guard('users.view', <UsersPage />), errorElement: <RouteError /> },
      { path: 'admin/roles', element: guard('roles.manage', <RolesPage />), errorElement: <RouteError /> },
      { path: 'profile', element: <ProfilePage />, errorElement: <RouteError /> },
      { path: '403', element: <ForbiddenPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
