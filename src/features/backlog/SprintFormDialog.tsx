import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { useCreateSprintMutation, useUpdateSprintMutation } from '@/features/sprints/api'
import { toIsoDate } from '@/lib/format'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import type { Sprint } from '@/types/api'

const schema = z
  .object({
    name: z.string().trim().min(1, 'validation:required').max(120, 'validation:max'),
    goal: z.string().max(2000, 'validation:max'),
    start_date: z.string().min(1, 'validation:required'),
    end_date: z.string().min(1, 'validation:required'),
  })
  .refine((v) => v.end_date >= v.start_date, { path: ['end_date'], message: 'validation:endAfterStart' })

type Values = z.infer<typeof schema>

function defaults(sprint?: Sprint): Values {
  if (sprint) return { name: sprint.name, goal: sprint.goal ?? '', start_date: sprint.start_date, end_date: sprint.end_date }
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 14)
  return { name: '', goal: '', start_date: toIsoDate(start), end_date: toIsoDate(end) }
}

/** Create a sprint, or edit one that isn't completed. */
export function SprintFormDialog({ sprint, onClose }: { sprint?: Sprint; onClose: () => void }) {
  const { t } = useTranslation(['backlog', 'common'])
  const fieldError = useFieldError()
  const [create, createState] = useCreateSprintMutation()
  const [update, updateState] = useUpdateSprintMutation()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults(sprint) })

  const submit = handleSubmit(async (values) => {
    const body = { ...values, goal: nullable(values.goal) }
    const result = sprint ? await update({ id: sprint.id, ...body }) : await create(body)
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(sprint ? t('saved') : t('created'))
    onClose()
  })

  const err = (m?: string) => fieldError(m, { max: 120 })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader eyebrow={t('sprintEyebrow')} title={sprint ? t('editSprint') : t('newSprint')} />
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('name')} error={err(errors.name?.message)} className="sm:col-span-2">
              <Input {...register('name')} />
            </Field>
            <Field label={t('common:fields.startDate')} error={err(errors.start_date?.message)}>
              <Input type="date" {...register('start_date')} />
            </Field>
            <Field label={t('common:fields.endDate')} error={err(errors.end_date?.message)}>
              <Input type="date" {...register('end_date')} />
            </Field>
            <Field label={t('goal')} error={err(errors.goal?.message)} className="sm:col-span-2">
              <Textarea rows={3} {...register('goal')} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={createState.isLoading || updateState.isLoading}>
              {sprint ? t('common:actions.save') : t('common:actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
