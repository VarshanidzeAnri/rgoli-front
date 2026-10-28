import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { useCompleteSprintMutation } from '@/features/sprints/api'
import type { Sprint } from '@/types/api'

/** Completes the active sprint, asking where unfinished tasks go (a planned sprint or the backlog). */
export function CompleteSprintDialog({ sprint, planned, onClose }: { sprint: Sprint; planned: Sprint[]; onClose: () => void }) {
  const { t } = useTranslation(['backlog', 'common'])
  const name = useId()
  const [target, setTarget] = useState<number | null>(null)
  const [complete, { isLoading }] = useCompleteSprintMutation()
  const unfinished = sprint.stats ? sprint.stats.total - sprint.stats.done : 0

  const confirm = async () => {
    const result = await complete({ id: sprint.id, move_open_to: target })
    if (!('error' in result)) {
      toast.success(t('completed'))
      onClose()
    }
  }

  const options = [{ id: null, label: t('toBacklog') }, ...planned.map((p) => ({ id: p.id, label: t('toSprint', { name: p.name }) }))]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader eyebrow={sprint.name} title={t('completeTitle')} description={t('completeText', { count: unfinished })} />
        <DialogBody>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t('completeText', { count: unfinished })}</legend>
            {options.map((o) => (
              <label key={o.id ?? 'backlog'} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 hover:border-primary/40 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5">
                <input type="radio" name={name} checked={target === o.id} onChange={() => setTarget(o.id)} className="accent-[hsl(var(--primary))]" />
                <span className="text-[13px]">{o.label}</span>
              </label>
            ))}
          </fieldset>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button variant="primary" disabled={isLoading} onClick={() => void confirm()}>
            {t('complete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
