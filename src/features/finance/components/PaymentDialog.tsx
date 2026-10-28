import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { output } from 'zod'

import { DatePicker, Field, OptionSelect } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { PAYMENT_METHODS } from '@/lib/enums'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import { toIsoDate } from '@/lib/format'
import type { ClientPayment } from '@/types/api'

import { useCreatePaymentMutation, useUpdatePaymentMutation } from '../api'
import { paymentSchema, type PaymentValues } from '../schemas'
import { ProjectSelect } from './ProjectSelect'

/** Add (no payment) or edit a client payment. */
export function PaymentDialog({ payment, onClose }: { payment?: ClientPayment; onClose: () => void }) {
  const { t } = useTranslation(['finance', 'enums', 'common'])
  const fieldError = useFieldError()
  const [create, { isLoading: creating }] = useCreatePaymentMutation()
  const [update, { isLoading: updating }] = useUpdatePaymentMutation()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PaymentValues, unknown, output<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      project_id: payment ? String(payment.project_id) : '',
      amount: payment?.amount ?? '',
      paid_at: payment?.paid_at ?? toIsoDate(new Date()),
      method: payment?.method ?? 'bank_transfer',
      note: payment?.note ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    const body = { amount: values.amount, paid_at: values.paid_at, method: values.method, note: nullable(values.note) }
    const projectId = Number(values.project_id)
    const result = payment ? await update({ id: payment.id, projectId, ...body }) : await create({ projectId, ...body })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t('common:saved'))
    onClose()
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader title={payment ? t('payments.dialogEdit') : t('payments.dialogNew')} />
        <form onSubmit={(e) => void submit(e)} noValidate>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <Field className="sm:col-span-2" label={t('payments.project')} error={fieldError(errors.project_id?.message)}>
                  <ProjectSelect value={field.value} onChange={field.onChange} disabled={Boolean(payment)} invalid={Boolean(errors.project_id)} />
                </Field>
              )}
            />
            <Field label={t('payments.amount')} error={fieldError(errors.amount?.message)}>
              <Input inputMode="decimal" className="num" {...register('amount')} />
            </Field>
            <Controller
              control={control}
              name="paid_at"
              render={({ field }) => (
                <Field label={t('payments.paidAt')} error={fieldError(errors.paid_at?.message)}>
                  <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? '')} clearable={false} />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Field className="sm:col-span-2" label={t('payments.method')} error={fieldError(errors.method?.message)}>
                  <OptionSelect
                    value={field.value}
                    onChange={(v) => {
                      const method = PAYMENT_METHODS.find((m) => m === v)
                      if (method) field.onChange(method)
                    }}
                    options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`enums:payment_method.${m}`) }))}
                  />
                </Field>
              )}
            />
            <Field className="sm:col-span-2" label={t('payments.note')} error={fieldError(errors.note?.message, { max: 2000 })}>
              <Textarea rows={2} {...register('note')} />
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
      </DialogContent>
    </Dialog>
  )
}
