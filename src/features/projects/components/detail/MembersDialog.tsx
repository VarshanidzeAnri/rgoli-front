import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ListSkeleton, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/misc'
import { useGetPeopleQuery } from '@/features/workspace/api'
import { applyServerErrors } from '@/lib/forms'
import type { Project } from '@/types/api'

import { useSyncMembersMutation } from '../../api'

export function MembersDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t } = useTranslation(['projects', 'common'])
  const { data: people, isLoading } = useGetPeopleQuery()
  const [selected, setSelected] = useState<Set<number>>(() => new Set((project.members ?? []).map((m) => m.id)))
  const [sync, { isLoading: saving }] = useSyncMembersMutation()

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const save = async () => {
    const result = await sync({ id: project.id, member_ids: [...selected] })
    if ('error' in result) {
      applyServerErrors(result.error, () => undefined)
      return
    }
    toast.success(t('common:saved'))
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader title={t('members.title')} description={t('members.subtitle')} />
        <DialogBody>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : !people || people.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('members.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {people.map((person) => {
                const id = `member-${person.id}`
                return (
                  <li key={person.id}>
                    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/40">
                      <Checkbox id={id} checked={selected.has(person.id)} onCheckedChange={(v) => toggle(person.id, v === true)} />
                      <UserAvatar user={person} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px]">{person.name}</span>
                        {person.job_title ? <span className="block truncate text-[11px] text-muted-foreground">{person.job_title}</span> : null}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
