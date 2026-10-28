import { DownloadIcon, PencilIcon, RotateCcwIcon, SearchIcon, UserPlusIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can, ConfirmDialog, EmptyState, ErrorState, ListSkeleton, PageHero, Pagination, Panel, Pill, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExportSystemMutation, useGetRolesQuery, useGetSystemStatsQuery, useGetUsersQuery, useResetDemoMutation, useUpdateUserMutation } from '@/features/admin/api'
import { UserFormDialog } from '@/features/admin/components/UserFormDialog'
import { useRoleLabel } from '@/features/admin/roleLabel'
import { useGetConfigQuery } from '@/features/workspace/api'
import { useCan } from '@/hooks/useCan'
import { useDebounced } from '@/hooks/useDebounced'
import { useFormat } from '@/hooks/useFormat'
import type { AdminUser } from '@/types/api'

const ALL = 'all'
const VISIBLE_PERMISSIONS = 3

function PermissionTags({ user }: { user: AdminUser }) {
  const { t } = useTranslation(['admin', 'permissions'])
  const shown = user.permissions.slice(0, VISIBLE_PERMISSIONS)
  const rest = user.permissions.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((p) => (
        <Pill key={p} tone="muted" className="font-mono text-[10px]">
          {t(`permissions:names.${p}`)}
        </Pill>
      ))}
      {rest > 0 ? (
        <Pill tone="primary" className="num">
          {t('users.morePermissions', { count: rest })}
        </Pill>
      ) : null}
    </div>
  )
}

function ActiveSwitch({ user }: { user: AdminUser }) {
  const { t } = useTranslation('admin')
  const canManage = useCan('users.manage')
  const [updateUser] = useUpdateUserMutation()
  return (
    <Switch
      checked={user.is_active}
      disabled={!canManage}
      aria-label={t('users.toggleActive', { name: user.name })}
      onCheckedChange={(checked) => {
        void updateUser({ id: user.id, is_active: checked }).then((r) => {
          if (!('error' in r)) toast.success(t(checked ? 'users.active' : 'users.inactive'))
        })
      }}
    />
  )
}

function SystemPanel() {
  const { t } = useTranslation(['admin', 'common'])
  const f = useFormat()
  const { data: stats } = useGetSystemStatsQuery()
  const { data: config } = useGetConfigQuery()
  const [exportSystem, exportState] = useExportSystemMutation()
  const [resetDemo, resetState] = useResetDemoMutation()
  const [confirmReset, setConfirmReset] = useState(false)

  const items = stats
    ? ([
        ['users', f.number(stats.users)],
        ['activeUsers', f.number(stats.active_users)],
        ['projects', f.number(stats.projects)],
        ['issues', f.number(stats.issues)],
        ['files', f.number(stats.files)],
        ['storage', f.bytes(stats.storage_bytes)],
      ] as const)
    : []

  return (
    <Panel
      eyebrow={t('system.title')}
      title={t('system.title')}
      actions={
        <>
          <Can permission="system.export">
            <Button
              size="sm"
              disabled={exportState.isLoading}
              onClick={() => {
                void exportSystem().then((r) => {
                  if (!('error' in r)) toast.success(t('system.exportQueued'))
                })
              }}
            >
              <DownloadIcon />
              {t('system.export')}
            </Button>
          </Can>
          {config?.demo ? (
            <Can permission="system.reset_demo">
              <Button size="sm" variant="destructive" onClick={() => setConfirmReset(true)}>
                <RotateCcwIcon />
                {t('system.resetDemo')}
              </Button>
            </Can>
          ) : null}
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-border/60 bg-secondary/25 p-3">
            <dt className="micro-label">{t(`system.${key}`)}</dt>
            <dd className="num mt-1.5 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        description={t('system.resetDemoText')}
        confirmLabel={t('system.resetDemoConfirm')}
        loading={resetState.isLoading}
        onConfirm={() => {
          void resetDemo().then((r) => {
            setConfirmReset(false)
            if (!('error' in r)) {
              toast.success(t('system.resetDone'))
              window.location.assign('/login')
            }
          })
        }}
      />
    </Panel>
  )
}

export default function UsersPage() {
  const { t } = useTranslation(['admin', 'common'])
  const roleLabel = useRoleLabel()
  const canManage = useCan('users.manage')
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined)
  const debounced = useDebounced(search.trim(), 300)

  const { data: roles = [] } = useGetRolesQuery()
  const { data, isLoading, isError, refetch } = useGetUsersQuery({
    search: debounced || undefined,
    role_id: roleId === ALL ? null : Number(roleId),
    page,
  })

  const users = data?.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        meta={
          data ? (
            <Pill tone="primary" dot>
              {t('users.count', { count: data.meta.total })}
            </Pill>
          ) : null
        }
        actions={
          canManage ? (
            <Button variant="primary" onClick={() => setEditing(null)}>
              <UserPlusIcon />
              {t('users.add')}
            </Button>
          ) : null
        }
      />

      {canManage ? <SystemPanel /> : null}

      <Panel
        title={t('users.title')}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative sm:w-64">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={t('users.searchPlaceholder')}
                aria-label={t('users.searchPlaceholder')}
                className="h-9 pl-9"
              />
            </div>
            <Select
              value={roleId}
              onValueChange={(v) => {
                setRoleId(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 sm:w-48" aria-label={t('users.columns.role')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('users.allRoles')}</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title={t('users.empty')} text={t('common:noResults')} />
        ) : (
          <>
            {/* md+: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border/60">
                    {(['user', 'role', 'email', 'permissions', 'active'] as const).map((c) => (
                      <th key={c} scope="col" className="micro-label px-3 py-2.5 font-normal">
                        {t(`users.columns.${c}`)}
                      </th>
                    ))}
                    {canManage ? (
                      <th scope="col" className="px-3 py-2.5">
                        <span className="sr-only">{t('users.columns.actions')}</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/25">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{user.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {user.roles[0] ? <Pill tone="violet">{roleLabel(user.roles[0])}</Pill> : <Pill>{t('users.noRole')}</Pill>}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11.5px] text-muted-foreground">{user.email}</td>
                      <td className="max-w-80 px-3 py-3">
                        <PermissionTags user={user} />
                      </td>
                      <td className="px-3 py-3">
                        <ActiveSwitch user={user} />
                      </td>
                      {canManage ? (
                        <td className="px-3 py-3 text-right">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(user)} aria-label={`${t('common:actions.edit')} · ${user.name}`}>
                            <PencilIcon />
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* below md: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {users.map((user) => (
                <li key={user.id} className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={user} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{user.email}</p>
                      <div className="mt-2">
                        {user.roles[0] ? <Pill tone="violet">{roleLabel(user.roles[0])}</Pill> : <Pill>{t('users.noRole')}</Pill>}
                      </div>
                    </div>
                    <ActiveSwitch user={user} />
                  </div>
                  <div className="mt-3">
                    <PermissionTags user={user} />
                  </div>
                  {canManage ? (
                    <Button size="sm" className="mt-3 w-full" onClick={() => setEditing(user)}>
                      <PencilIcon />
                      {t('common:actions.edit')}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>

            {data ? <Pagination meta={data.meta} onPage={setPage} /> : null}
          </>
        )}
      </Panel>

      {editing !== undefined ? (
        <UserFormDialog key={editing?.id ?? 'new'} open user={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </div>
  )
}
