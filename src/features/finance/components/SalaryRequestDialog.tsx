import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { output } from 'zod'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import type { GlobalDialogProps } from '@/features/dialogs/GlobalDialogs'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import type { SalaryRequest } from '@/types/api'

import { useCreateSalaryRequestMutation, useGetSalaryRequestsQuery, useUpdateSalaryRequestMutation } from '../api'
import { salaryRequestSchema, type SalaryRequestValues } from '../schemas'
import { ProjectSelect } from './ProjectSelect'

function SalaryRequestForm({ existing, projectId, onClose }: { existing?: SalaryRequest; projectId?: number; onClose: () => void }) {
  const { t } = useTranslation(['finance', 'common'])
  const fieldError = useFieldError()
  const [create, { isLoading: creating }] = useCreateSalaryRequestMutation()
  const [update, { isLoading: updating }] = useUpdateSalaryRequestMutation()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SalaryRequestValues, unknown, output<typeof salaryRequestSchema>>({
    resolver: zodResolver(salaryRequestSchema),
    defaultValues: {
      project_id: String(existing?.project.id ?? projectId ?? ''),
      title: existing?.title ?? '',
      amount: existing?.amount ?? '',
      note: existing?.note ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    const result = existing
      ? await update({ id: existing.id, title: values.title, amount: values.amount, note: nullable(values.note) })
      : await create({ project_id: Number(values.project_id), title: values.title, amount: values.amount, note: nullable(values.note) })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(existing ? t('common:saved') : t('salary.submitted'))
    onClose()
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <DialogBody className="flex flex-col gap-4">
        <Controller
          control={control}
          name="project_id"
          render={({ field }) => (
            <Field label={t('payments.project')} error={fieldError(errors.project_id?.message)}>
              <ProjectSelect value={field.value} onChange={field.onChange} disabled={Boolean(existing)} invalid={Boolean(errors.project_id)} />
            </Field>
          )}
        />
        <Field label={t('salary.titleLabel')} error={fieldError(errors.title?.message, { max: 200 })}>
          <Input placeholder={t('salary.titlePlaceholder')} {...register('title')} />
        </Field>
        <Field label={t('payments.amount')} error={fieldError(errors.amount?.message)}>
          <Input inputMode="decimal" className="num" {...register('amount')} />
        </Field>
        <Field label={t('payments.note')} error={fieldError(errors.note?.message, { max: 2000 })}>
          <Textarea rows={3} {...register('note')} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={creating || updating}>
          {t('common:actions.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Create (no id) or edit own pending request (id). Hosted by GlobalDialogs. */
export default function SalaryRequestDialog({ open, onClose, id, projectId }: GlobalDialogProps) {
  const { t } = useTranslation('finance')
  const { existing, isLoading } = useGetSalaryRequestsQuery(undefined, {
    skip: id === undefined,
    selectFromResult: ({ data, isLoading: loading }) => ({ existing: data?.data.find((r) => r.id === id), isLoading: loading }),
  })
  const waiting = id !== undefined && (isLoading || !existing)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader title={id ? t('salary.dialogEdit') : t('salary.dialogNew')} description={t('salary.dialogDescription')} />
        {waiting ? null : <SalaryRequestForm existing={existing} projectId={projectId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
