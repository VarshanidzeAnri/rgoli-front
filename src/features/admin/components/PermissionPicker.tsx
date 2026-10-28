import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { PERMISSION_GROUP_KEYS, PERMISSION_GROUPS, type Permission, type PermissionGroup } from '@/lib/permissions'

/**
 * Grouped permission checkboxes (Projects, Issues, Files, Map, Finance, Reports, Admin)
 * with a "select all in group" checkbox per module (indeterminate when partly selected).
 */
export function PermissionPicker({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: readonly Permission[]
  onChange: (next: Permission[]) => void
  disabled?: boolean
  compact?: boolean
}) {
  const { t } = useTranslation(['permissions', 'admin'])
  const baseId = useId()
  const selected = new Set(value)

  const setGroup = (group: PermissionGroup, on: boolean) => {
    const next = new Set(selected)
    for (const p of PERMISSION_GROUPS[group]) {
      if (on) next.add(p)
      else next.delete(p)
    }
    onChange([...next])
  }

  const toggle = (permission: Permission, on: boolean) => {
    const next = new Set(selected)
    if (on) next.add(permission)
    else next.delete(permission)
    onChange([...next])
  }

  return (
    <div className={cn('grid gap-3', compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
      {PERMISSION_GROUP_KEYS.map((group) => {
        const perms = PERMISSION_GROUPS[group]
        const count = perms.filter((p) => selected.has(p)).length
        const state = count === 0 ? false : count === perms.length ? true : 'indeterminate'
        const groupId = `${baseId}-${group}`
        return (
          <fieldset key={group} className="rounded-2xl border border-border/60 bg-secondary/20 p-3.5" disabled={disabled}>
            <legend className="sr-only">{t(`groups.${group}`)}</legend>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <label htmlFor={groupId} className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold">
                <Checkbox
                  id={groupId}
                  checked={state}
                  disabled={disabled}
                  onCheckedChange={(c) => setGroup(group, c === true)}
                  aria-label={`${t('admin:roles.selectAll')} · ${t(`groups.${group}`)}`}
                />
                {t(`groups.${group}`)}
              </label>
              <span className="num text-[10.5px] text-muted-foreground">
                {t('admin:roles.selectedCount', { count, total: perms.length })}
              </span>
            </div>
            <ul className="mt-2.5 flex flex-col gap-2">
              {perms.map((permission) => {
                const id = `${baseId}-${permission}`
                return (
                  <li key={permission}>
                    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-[12.5px]">
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={selected.has(permission)}
                        disabled={disabled}
                        onCheckedChange={(c) => toggle(permission, c === true)}
                      />
                      <span className="min-w-0">
                        <span className="block">{t(`names.${permission}`)}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">{permission}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )
      })}
    </div>
  )
}
