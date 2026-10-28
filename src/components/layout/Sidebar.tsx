import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Logo, ProgressBar, UserAvatar } from '@/components/kit'
import { useGetProjectsQuery } from '@/features/projects/api'
import { useCan } from '@/hooks/useCan'
import { cn } from '@/lib/cn'
import { useAppSelector } from '@/store'
import { selectPermissionSet, selectUser } from '@/store/authSlice'

import { NAV_ITEMS, type NavItem } from './navItems'

function NavEntry({ item, count, onNavigate }: { item: NavItem; count?: number; onNavigate?: () => void }) {
  const { t } = useTranslation('nav')
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground',
          isActive && 'bg-primary/8 text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span aria-hidden className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
          ) : null}
          <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} aria-hidden />
          <span className="truncate">{t(item.label)}</span>
          {count !== undefined ? <span className="num ml-auto text-[11px] text-muted-foreground">{count}</span> : null}
        </>
      )}
    </NavLink>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation(['nav', 'common'])
  const permissions = useAppSelector(selectPermissionSet)
  const user = useAppSelector(selectUser)
  const canProjects = useCan('projects.view')
  const { data: projects } = useGetProjectsQuery({ per_page: 100 }, { skip: !canProjects })
  const { data: mine } = useGetProjectsQuery({ mine: true, per_page: 5, sort: 'end_date' }, { skip: !canProjects })

  const visible = NAV_ITEMS.filter((item) =>
    typeof item.permission === 'string' ? permissions.has(item.permission) : item.permission.some((p) => permissions.has(p)),
  )
  const groups = (['navigation', 'management'] as const).map((group) => ({ group, items: visible.filter((i) => i.group === group) }))

  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <div>
        <Logo />
        <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          {t('common:brand.systemOnline')} · {t('common:brand.version', { version: 5 })}
        </p>
      </div>

      <nav aria-label={t('navigation')} className="flex flex-col gap-4">
        {groups.map(({ group, items }) =>
          items.length > 0 ? (
            <div key={group}>
              <p className="micro-label mb-1.5 px-3">{t(group)}</p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <NavEntry
                    key={item.to}
                    item={item}
                    count={item.label === 'projects' ? projects?.meta.total : undefined}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}
      </nav>

      {canProjects ? (
        <div>
          <p className="micro-label mb-2 px-3">{t('myProjects')}</p>
          {mine && mine.data.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {mine.data.map((p) => (
                <li key={p.id}>
                  <NavLink to={`/projects/${p.id}`} onClick={onNavigate} className="block rounded-xl px-3 py-1.5 hover:bg-secondary/40">
                    <span className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate">{p.name}</span>
                      <span className="num text-[10.5px] text-muted-foreground">{p.progress}%</span>
                    </span>
                    <ProgressBar value={p.progress} className="mt-1.5 h-1" label={p.name} />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 text-[11.5px] text-muted-foreground">{t('noProjects')}</p>
          )}
        </div>
      ) : null}

      {user ? (
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className="mt-auto flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3 transition hover:border-primary/40"
        >
          <UserAvatar user={user} size="md" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{user.job_title ?? user.email}</span>
          </span>
        </NavLink>
      ) : null}
    </div>
  )
}

/** Desktop sidebar (268px glass card); on mobile the same content lives in a sheet (see AppShell). */
export function Sidebar() {
  return (
    <aside className="glass sticky top-[80px] hidden h-[calc(100dvh-96px)] w-[268px] shrink-0 overflow-y-auto lg:block">
      <SidebarContent />
    </aside>
  )
}
