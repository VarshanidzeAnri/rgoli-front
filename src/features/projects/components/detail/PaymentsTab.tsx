import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Can, ConfirmDialog, DatePicker, EmptyState, ErrorState, Field, ListSkeleton, OptionSelect, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { useCreatePaymentMutation, useDeletePaymentMutation, useGetProjectPaymentsQuery } from '@/features/finance/api'
import { useFormat } from '@/hooks/useFormat'
import { PAYMENT_METHODS } from '@/lib/enums'
import { toIsoDate } from '@/lib/format'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import type { ClientPayment } from '@/types/api'

import { MONEY } from '../projectSchema'

const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(MONEY, 'validation:money')
    .refine((v) => Number(v) > 0, 'validation:positive'),
  paid_at: z.string().min(1, 'validation:required'),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().max(2000, 'validation:max'),
})
type PaymentValues = z.infer<typeof paymentSchema>

function PaymentFormDialog({ projectId, onClose }: { projectId: number; onClose: () => void }) {
  const { t } = useTranslation(['projects', 'common', 'enums'])
  const fieldError = useFieldError()
  const [create, { isLoading }] = useCreatePaymentMutation()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: '', paid_at: toIsoDate(new Date()), method: 'bank_transfer', note: '' },
  })

  const submit = handleSubmit(async (v) => {
    const result = await create({ projectId, amount: v.amount.trim(), paid_at: v.paid_at, method: v.method, note: nullable(v.note) })
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
        <DialogHeader title={t('payments.createTitle')} />
        <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('payments.amount')} error={fieldError(errors.amount?.message)}>
                <Input inputMode="decimal" className="num" {...register('amount')} />
              </Field>
              <Field label={t('payments.paidAt')} error={fieldError(errors.paid_at?.message)}>
                <Controller
                  control={control}
                  name="paid_at"
                  render={({ field }) => <DatePicker value={field.value} clearable={false} onChange={(v) => field.onChange(v ?? toIsoDate(new Date()))} />}
                />
              </Field>
            </div>
            <Field label={t('payments.method')}>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <OptionSelect
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 'bank_transfer')}
                    options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`enums:payment_method.${m}`) }))}
                  />
                )}
              />
            </Field>
            <Field label={t('payments.note')} error={fieldError(errors.note?.message, { max: 2000 })}>
              <Textarea rows={2} {...register('note')} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PaymentsTab({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['projects', 'common', 'enums'])
  const f = useFormat()
  const { data, isLoading, isError, refetch } = useGetProjectPaymentsQuery(projectId)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<ClientPayment | null>(null)
  const [remove, { isLoading: removing }] = useDeletePaymentMutation()
  const total = data?.data.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await remove({ id: deleting.id, projectId })
    if (!('error' in result)) toast.success(t('common:deleted'))
    setDeleting(null)
  }

  return (
    <Panel
      title={t('payments.title')}
      eyebrow={data ? t('payments.total', { amount: f.money(total) }) : undefined}
      actions={
        <Can permission="client_payments.manage">
          <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
            <PlusIcon />
            {t('payments.add')}
          </Button>
        </Can>
      }
    >
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('payments.empty')} text="" />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.data.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-secondary/20 px-4 py-3">
              <span className="num w-24 text-[12px] text-muted-foreground">{f.date(payment.paid_at)}</span>
              <span className="num text-[14px] font-semibold text-success">{f.money(payment.amount)}</span>
              <span className="text-[12px] text-muted-foreground">{t(`enums:payment_method.${payment.method}`)}</span>
              <span className="min-w-0 flex-1 truncate text-[12px]">{payment.note}</span>
              {payment.recorder ? (
                <span className="text-[11px] text-muted-foreground">{t('payments.recordedBy', { name: payment.recorder.name })}</span>
              ) : null}
              <Can permission="client_payments.manage">
                <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(payment)} aria-label={t('payments.delete')}>
                  <Trash2Icon />
                </Button>
              </Can>
            </li>
          ))}
        </ul>
      )}

      {adding ? <PaymentFormDialog projectId={projectId} onClose={() => setAdding(false)} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        description={t('common:confirm.deleteText', { name: deleting ? f.money(deleting.amount) : '' })}
        onConfirm={() => void confirmDelete()}
        loading={removing}
      />
    </Panel>
  )
}
