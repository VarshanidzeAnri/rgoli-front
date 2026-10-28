import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import type { GlobalDialogProps } from '@/features/dialogs/GlobalDialogs'
import { useCan } from '@/hooks/useCan'
import { DISCIPLINES, STATUSES } from '@/lib/enums'
import { applyServerErrors, useFieldError } from '@/lib/forms'

import { useCreateProjectMutation, useGetProjectQuery, useUpdateProjectMutation } from '../api'
import { emptyProjectValues, makeProjectSchema, projectToValues, toProjectInput, type ProjectFormValues } from './projectSchema'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="micro-label mb-3 text-primary">{title}</legend>
      {children}
    </fieldset>
  )
}

/** Create (no id) or edit (id) a project. Hosted by GlobalDialogs and the project page. */
export default function ProjectFormDialog({ open, onClose, id }: GlobalDialogProps) {
  const { t } = useTranslation(['projects', 'common', 'enums'])
  const fieldError = useFieldError()
  const navigate = useNavigate()
  const isEdit = id !== undefined
  const canSeeFinance = useCan('finance.view')
  const { data: project, isLoading } = useGetProjectQuery(id ?? 0, { skip: !isEdit })
  const [createProject, createState] = useCreateProjectMutation()
  const [updateProject, updateState] = useUpdateProjectMutation()

  const schema = useMemo(() => makeProjectSchema(!isEdit || canSeeFinance), [isEdit, canSeeFinance])
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(schema), defaultValues: emptyProjectValues })

  useEffect(() => {
    if (project) reset(projectToValues(project))
  }, [project, reset])

  const submit = handleSubmit(async (values) => {
    const input = toProjectInput(values)
    // Without finance.view the budget fields are not loaded, so don't overwrite them on edit.
    const payload = isEdit && !canSeeFinance ? { ...input, budget: undefined, discount_price: undefined } : input
    const result = isEdit ? await updateProject({ id, ...payload }) : await createProject(input)
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t('common:saved'))
    onClose()
    if (!isEdit) void navigate(`/projects/${result.data.id}`)
  })

  const err = (message: string | undefined) => fieldError(message, { max: 100, min: 0 })
  const saving = createState.isLoading || updateState.isLoading
  const showMoney = !isEdit || canSeeFinance

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader eyebrow={t('form.eyebrow')} title={isEdit ? t('form.editTitle') : t('form.createTitle')} />
        <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-7">
            {isEdit && isLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <>
                <Section title={t('form.sectionMain')}>
                  <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                    <Field label={t('form.key')} error={err(errors.key?.message)} hint={t('form.keyHint')}>
                      <Input className="font-mono uppercase" maxLength={10} autoComplete="off" {...register('key', { setValueAs: (v: string) => v.toUpperCase() })} />
                    </Field>
                    <Field label={t('form.name')} error={err(errors.name?.message)}>
                      <Input {...register('name')} />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('form.discipline')} error={err(errors.discipline?.message)}>
                      <NativeSelect {...register('discipline')}>
                        {DISCIPLINES.map((d) => (
                          <option key={d} value={d}>
                            {t(`enums:discipline.${d}`)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label={t('form.status')} error={err(errors.status?.message)}>
                      <NativeSelect {...register('status')}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t(`enums:status.${s}`)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                  <Field label={t('form.description')} error={err(errors.description?.message)}>
                    <Textarea rows={3} {...register('description')} />
                  </Field>
                </Section>

                <Section title={t('form.sectionClient')}>
                  <Field label={t('form.clientName')} error={err(errors.client_name?.message)}>
                    <Input {...register('client_name')} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('form.clientPhone')} error={err(errors.client_phone?.message)}>
                      <Input type="tel" {...register('client_phone')} />
                    </Field>
                    <Field label={t('form.clientEmail')} error={err(errors.client_email?.message)}>
                      <Input type="email" {...register('client_email')} />
                    </Field>
                  </div>
                </Section>

                <Section title={t('form.sectionMoney')}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {showMoney ? (
                      <>
                        <Field label={t('form.budget')} error={err(errors.budget?.message)}>
                          <Input inputMode="decimal" className="num" {...register('budget')} />
                        </Field>
                        <Field label={t('form.discountPrice')} error={err(errors.discount_price?.message)} hint={t('form.discountHint')}>
                          <Input inputMode="decimal" className="num" {...register('discount_price')} />
                        </Field>
                      </>
                    ) : null}
                    <Field label={t('form.progress')} error={err(errors.progress?.message)}>
                      <Input inputMode="numeric" className="num" {...register('progress')} />
                    </Field>
                  </div>
                </Section>

                <Section title={t('form.sectionSchedule')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('form.startDate')} error={err(errors.start_date?.message)}>
                      <Input type="date" {...register('start_date')} />
                    </Field>
                    <Field label={t('form.endDate')} error={err(errors.end_date?.message)}>
                      <Input type="date" {...register('end_date')} />
                    </Field>
                  </div>
                  <Field label={t('form.address')} error={err(errors.address?.message)}>
                    <Input {...register('address')} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('form.lat')} error={err(errors.lat?.message)}>
                      <Input inputMode="decimal" className="num" {...register('lat')} />
                    </Field>
                    <Field label={t('form.lng')} error={err(errors.lng?.message)}>
                      <Input inputMode="decimal" className="num" {...register('lng')} />
                    </Field>
                  </div>
                </Section>
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={saving || (isEdit && isLoading)}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
