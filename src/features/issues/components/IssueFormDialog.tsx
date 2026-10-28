import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Combobox, DatePicker, Field, OptionSelect, type ComboOption } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import type { GlobalDialogProps } from '@/features/dialogs/GlobalDialogs'
import { useCreateIssueMutation, useGetIssueQuery, useUpdateIssueMutation } from '@/features/issues/api'
import { useGetProjectsQuery } from '@/features/projects/api'
import { PRIORITIES, STATUSES, type Priority, type Status } from '@/lib/enums'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'

import { AssigneePicker } from './AssigneePicker'

const schema = z.object({
  project_id: z.number({ error: 'validation:required' }).int().positive('validation:required'),
  title: z.string().trim().min(1, 'validation:required').max(255, 'validation:max'),
  description: z.string().max(20000, 'validation:max'),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  due_date: z.string(),
  points: z.number({ error: 'validation:integer' }).int('validation:integer').min(1, 'validation:minValue').max(100, 'validation:maxValue'),
  assignee_ids: z.array(z.number()),
})

const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v)
const isPriority = (v: string): v is Priority => (PRIORITIES as readonly string[]).includes(v)

export type IssueFormValues = z.infer<typeof schema>

/**
 * Create (no id) or edit (id) a task. `projectId` pre-selects the project and
 * `initialStatus` the column it lands in.
 */
export default function IssueFormDialog({ open, onClose, id, projectId, initialStatus }: GlobalDialogProps & { initialStatus?: Status }) {
  const { t } = useTranslation(['board', 'common', 'enums'])
  const fieldError = useFieldError()
  const editing = id !== undefined
  const { data: issue } = useGetIssueQuery(id ?? 0, { skip: !editing })
  const { data: projects } = useGetProjectsQuery({ per_page: 100, sort: 'name' })
  const projectOptions = useMemo<ComboOption[]>(
    () => (projects?.data ?? []).map((p) => ({ value: p.id, label: p.name, hint: p.key })),
    [projects],
  )
  const [createIssue, createState] = useCreateIssueMutation()
  const [updateIssue, updateState] = useUpdateIssueMutation()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: projectId ?? 0,
      title: '',
      description: '',
      status: initialStatus ?? 'todo',
      priority: 'medium',
      due_date: '',
      points: 1,
      assignee_ids: [],
    },
  })

  useEffect(() => {
    if (issue) {
      reset({
        project_id: issue.project.id,
        title: issue.title,
        description: issue.description ?? '',
        status: issue.status,
        priority: issue.priority,
        due_date: issue.due_date ?? '',
        points: issue.points,
        assignee_ids: issue.assignees?.map((a) => a.id) ?? [],
      })
    }
  }, [issue, reset])

  const submit = handleSubmit(async (values) => {
    const common = {
      title: values.title,
      description: nullable(values.description),
      priority: values.priority,
      due_date: nullable(values.due_date),
      points: values.points,
      assignee_ids: values.assignee_ids,
    }
    const result = editing
      ? await updateIssue({ id, ...common })
      : await createIssue({ ...common, project_id: values.project_id, status: values.status })

    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(editing ? t('issue.saved') : t('issue.created'))
    onClose()
  })

  const busy = createState.isLoading || updateState.isLoading
  const err = (m?: string) => fieldError(m, { min: 1, max: 100 })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader eyebrow={t('issue.eyebrow')} title={editing ? t('issue.editTitle') : t('issue.createTitle')} />
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('common:fields.project')} error={err(errors.project_id?.message)} className="sm:col-span-2">
              <Controller
                control={control}
                name="project_id"
                render={({ field }) => (
                  <Combobox
                    ref={field.ref}
                    disabled={editing}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? 0)}
                    options={projectOptions}
                    placeholder={t('issue.selectProject')}
                    searchPlaceholder={t('common:actions.search')}
                  />
                )}
              />
            </Field>
            <Field label={t('common:fields.title')} error={err(errors.title?.message)} className="sm:col-span-2">
              <Input placeholder={t('issue.titlePlaceholder')} {...register('title')} />
            </Field>
            <Field label={t('common:fields.description')} error={err(errors.description?.message)} className="sm:col-span-2">
              <Textarea rows={4} {...register('description')} />
            </Field>
            {!editing ? (
              <Field label={t('common:fields.status')} error={err(errors.status?.message)}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <OptionSelect
                      ref={field.ref}
                      value={field.value}
                      onChange={(v) => {
                        if (v && isStatus(v)) field.onChange(v)
                      }}
                      options={STATUSES.map((s) => ({ value: s, label: t(`enums:status.${s}`) }))}
                    />
                  )}
                />
              </Field>
            ) : null}
            <Field label={t('common:fields.priority')} error={err(errors.priority?.message)}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <OptionSelect
                    ref={field.ref}
                    value={field.value}
                    onChange={(v) => {
                      if (v && isPriority(v)) field.onChange(v)
                    }}
                    options={PRIORITIES.map((p) => ({ value: p, label: t(`enums:priority.${p}`) }))}
                  />
                )}
              />
            </Field>
            <Field label={t('common:fields.dueDate')} error={err(errors.due_date?.message)}>
              <Controller
                control={control}
                name="due_date"
                render={({ field }) => <DatePicker ref={field.ref} value={field.value || null} onChange={(v) => field.onChange(v ?? '')} clearable />}
              />
            </Field>
            <Field label={t('common:fields.points')} error={err(errors.points?.message)}>
              <Input type="number" min={1} max={100} inputMode="numeric" {...register('points', { valueAsNumber: true })} />
            </Field>
            <Field label={t('common:fields.assignees')} className="sm:col-span-2">
              <Controller
                control={control}
                name="assignee_ids"
                render={({ field }) => <AssigneePicker value={field.value} onChange={field.onChange} />}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {editing ? t('common:actions.save') : t('common:actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
