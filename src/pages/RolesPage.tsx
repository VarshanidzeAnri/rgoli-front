import { PencilIcon, PlusIcon, SaveIcon, ShieldCheckIcon, ShieldIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog, EmptyState, ErrorState, ListSkeleton, PageHero, Panel, Pill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useDeleteRoleMutation, useGetRolesQuery, useUpdateRoleMutation } from '@/features/admin/api'
import { PermissionPicker } from '@/features/admin/components/PermissionPicker'
import { RoleFormDialog } from '@/features/admin/components/RoleFormDialog'
import { useRoleLabel } from '@/features/admin/roleLabel'
import { cn } from '@/lib/cn'
import { ALL_PERMISSIONS, type Permission } from '@/lib/permissions'
import { isApiError } from '@/store/api'
import type { Role } from '@/types/api'

function sameSet(a: readonly Permission[], b: readonly Permission[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((p) => set.has(p))
}

/** Permission editor for one role; local draft until saved. */
function RoleEditor({ role, onDeleted }: { role: Role; onDeleted: () => void }) {
  const { t } = useTranslation(['admin', 'common'])
  const roleLabel = useRoleLabel()
  const [draft, setDraft] = useState<Permission[]>(role.permissions)
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [updateRole, updateState] = useUpdateRoleMutation()
  const [deleteRole, deleteState] = useDeleteRoleMutation()
  const dirty = !role.is_owner && !sameSet(draft, role.permissions)

  return (
    <Panel
      eyebrow={t('roles.permissionsTitle')}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {roleLabel(role)}
          {role.is_system ? <Pill tone="info">{t('roles.system')}</Pill> : null}
          {dirty ? <Pill tone="warning" dot>{t('roles.unsaved')}</Pill> : null}
        </span>
      }
      actions={
        <>
          <Button size="sm" variant="ghost" onClick={() => setRenaming(true)}>
            <PencilIcon />
            {t('roles.rename')}
          </Button>
          {!role.is_system ? (
            <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2Icon />
              {t('roles.delete')}
            </Button>
          ) : null}
          {!role.is_owner ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!dirty || updateState.isLoading}
              onClick={() => {
                void updateRole({ id: role.id, permissions: draft }).then((r) => {
                  if (!('error' in r)) toast.success(t('roles.saved'))
                })
              }}
            >
              <SaveIcon />
              {t('roles.save')}
            </Button>
          ) : null}
        </>
      }
    >
      {role.is_owner ? (
        <p role="note" className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-[12.5px] text-primary">
          {t('roles.ownerNote')}
        </p>
      ) : null}
      <PermissionPicker value={role.is_owner ? ALL_PERMISSIONS : draft} onChange={setDraft} disabled={role.is_owner} />

      {renaming ? <RoleFormDialog open role={role} onClose={() => setRenaming(false)} /> : null}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        description={t('roles.deleteText', { name: roleLabel(role) })}
        loading={deleteState.isLoading}
        onConfirm={() => {
          void deleteRole(role.id).then((r) => {
            setConfirmDelete(false)
            if ('error' in r) {
              // 422: role still assigned to users — show the server's translated reason.
              if (isApiError(r.error) && r.error.status === 422) toast.error(r.error.fieldErrors.role ?? r.error.message)
              return
            }
            toast.success(t('common:deleted'))
            onDeleted()
          })
        }}
      />
    </Panel>
  )
}

export default function RolesPage() {
  const { t } = useTranslation(['admin', 'common'])
  const roleLabel = useRoleLabel()
  const { data: roles = [], isLoading, isError, refetch } = useGetRolesQuery()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const selected = roles.find((r) => r.id === selectedId) ?? roles[0]

  return (
    <div className="flex flex-col gap-5">
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('roles.title')}
        subtitle={t('roles.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <PlusIcon />
            {t('roles.add')}
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : roles.length === 0 ? (
        <EmptyState icon={ShieldIcon} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <Panel title={t('roles.title')} bodyClassName="p-2">
            <ul className="flex flex-col gap-1" aria-label={t('roles.title')}>
              {roles.map((role) => {
                const active = role.id === selected?.id
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setSelectedId(role.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary/50',
                        active && 'bg-primary/10 text-primary',
                      )}
                    >
                      {role.is_owner ? <ShieldCheckIcon className="size-4 shrink-0" aria-hidden /> : <ShieldIcon className="size-4 shrink-0 opacity-70" aria-hidden />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{roleLabel(role)}</span>
                        <span className="block text-[11px] text-muted-foreground">{t('roles.usersCount', { count: role.users_count ?? 0 })}</span>
                      </span>
                      {role.is_system ? <Pill tone="info">{t('roles.system')}</Pill> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>

          {selected ? (
            <RoleEditor key={`${selected.id}:${selected.permissions.join(',')}`} role={selected} onDeleted={() => setSelectedId(null)} />
          ) : (
            <Panel>
              <EmptyState icon={ShieldIcon} title={t('roles.selectRole')} />
            </Panel>
          )}
        </div>
      )}

      {creating ? <RoleFormDialog open onClose={() => setCreating(false)} onCreated={(r) => setSelectedId(r.id)} /> : null}
    </div>
  )
}
