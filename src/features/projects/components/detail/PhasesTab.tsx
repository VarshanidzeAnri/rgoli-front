import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Can, ConfirmDialog, DatePicker, EmptyState, Field, OptionSelect, Panel, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useFormat } from '@/hooks/useFormat'
import { STATUSES } from '@/lib/enums'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import type { Phase, Project } from '@/types/api'

import { useCreatePhaseMutation, useDeletePhaseMutation, useReorderPhasesMutation, useUpdatePhaseMutation } from '../../api'

const phaseSchema = z
  .object({
    name: z.string().trim().min(1, 'validation:required').max(200, 'validation:max'),
    status: z.enum(STATUSES),
    start_date: z.string(),
    end_date: z.string(),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, { path: ['end_date'], message: 'validation:endAfterStart' })

type PhaseValues = z.infer<typeof phaseSchema>

function PhaseFormDialog({ projectId, phase, onClose }: { projectId: number; phase: Phase | null; onClose: () => void }) {
  const { t } = useTranslation(['projects', 'common', 'enums'])
  const fieldError = useFieldError()
  const [create, createState] = useCreatePhaseMutation()
  const [update, updateState] = useUpdatePhaseMutation()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PhaseValues>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: phase?.name ?? '',
      status: phase?.status ?? 'todo',
      start_date: phase?.start_date ?? '',
      end_date: phase?.end_date ?? '',
    },
  })

  const submit = handleSubmit(async (v) => {
    const body = { name: v.name.trim(), status: v.status, start_date: nullable(v.start_date), end_date: nullable(v.end_date) }
    const result = phase ? await update({ id: phase.id, projectId, ...body }) : await create({ projectId, ...body })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t('common:saved'))
    onClose()
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader title={phase ? t('phases.editTitle') : t('phases.createTitle')} />
        <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <Field label={t('phases.name')} error={fieldError(errors.name?.message, { max: 200 })}>
              <Input {...register('name')} />
            </Field>
            <Field label={t('common:fields.status')}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <OptionSelect
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 'todo')}
                    options={STATUSES.map((s) => ({ value: s, label: t(`enums:status.${s}`) }))}
                  />
                )}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('common:fields.startDate')}>
                <Controller control={control} name="start_date" render={({ field }) => <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? '')} />} />
              </Field>
              <Field label={t('common:fields.endDate')} error={fieldError(errors.end_date?.message)}>
                <Controller control={control} name="end_date" render={({ field }) => <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? '')} />} />
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={createState.isLoading || updateState.isLoading}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PhasesTab({ project }: { project: Project }) {
  const { t } = useTranslation(['projects', 'common'])
  const f = useFormat()
  const phases = [...(project.phases ?? [])].sort((a, b) => a.order - b.order)
  const [editing, setEditing] = useState<Phase | null | 'new'>(null)
  const [deleting, setDeleting] = useState<Phase | null>(null)
  const [reorder, { isLoading: reordering }] = useReorderPhasesMutation()
  const [remove, { isLoading: removing }] = useDeletePhaseMutation()

  const move = async (index: number, delta: -1 | 1) => {
    const ids = phases.map((p) => p.id)
    const target = index + delta
    const a = ids[index]
    const b = ids[target]
    if (a === undefined || b === undefined) return
    ids[index] = b
    ids[target] = a
    const result = await reorder({ projectId: project.id, phase_ids: ids })
    if (!('error' in result)) toast.success(t('common:saved'))
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await remove({ id: deleting.id, projectId: project.id })
    if (!('error' in result)) toast.success(t('common:deleted'))
    setDeleting(null)
  }

  return (
    <Panel
      title={t('phases.title')}
      actions={
        <Can permission="phases.manage">
          <Button size="sm" variant="primary" onClick={() => setEditing('new')}>
            <PlusIcon />
            {t('phases.add')}
          </Button>
        </Can>
      }
    >
      {phases.length === 0 ? (
        <EmptyState title={t('phases.empty')} text="" />
      ) : (
        <ol className="flex flex-col gap-2">
          {phases.map((phase, index) => (
            <li
              key={phase.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-secondary/20 px-4 py-3"
            >
              <span className="num inline-flex size-7 items-center justify-center rounded-full border border-primary/40 text-[11px] text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{phase.name}</span>
                <span className="num block text-[11px] text-muted-foreground">
                  {f.date(phase.start_date)} — {f.date(phase.end_date)}
                </span>
              </span>
              <StatusPill status={phase.status} />
              <Can permission="phases.manage">
                <span className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" disabled={index === 0 || reordering} onClick={() => void move(index, -1)} aria-label={t('phases.moveUp')}>
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={index === phases.length - 1 || reordering}
                    onClick={() => void move(index, 1)}
                    aria-label={t('phases.moveDown')}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing(phase)} aria-label={t('phases.edit')}>
                    <PencilIcon />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(phase)} aria-label={t('phases.delete')}>
                    <Trash2Icon />
                  </Button>
                </span>
              </Can>
            </li>
          ))}
        </ol>
      )}

      {editing !== null ? (
        <PhaseFormDialog projectId={project.id} phase={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        description={t('common:confirm.deleteText', { name: deleting?.name ?? '' })}
        onConfirm={() => void confirmDelete()}
        loading={removing}
      />
    </Panel>
  )
}
