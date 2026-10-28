import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useUpdateLocationMutation } from '@/features/projects/api'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import type { Project } from '@/types/api'

const schema = z.object({
  lat: z.coerce.number<string>('validation:number').min(-90, 'validation:minValue').max(90, 'validation:maxValue'),
  lng: z.coerce.number<string>('validation:number').min(-180, 'validation:minValue').max(180, 'validation:maxValue'),
  address: z.string().max(255, 'validation:max'),
})
type Values = z.input<typeof schema>

export function LocationDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t } = useTranslation(['map', 'common'])
  const fieldError = useFieldError()
  const [update, { isLoading }] = useUpdateLocationMutation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { lat: project.lat?.toString() ?? '', lng: project.lng?.toString() ?? '', address: project.address ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    const result = await update({ id: project.id, lat: values.lat, lng: values.lng, address: nullable(values.address) })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t('locationSaved'))
    onClose()
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader eyebrow={project.key} title={t('dialog.title')} description={t('dialog.description')} />
        <form onSubmit={(e) => void submit(e)} noValidate>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t('dialog.lat')} error={fieldError(errors.lat?.message, { min: -90, max: 90 })}>
              <Input inputMode="decimal" {...register('lat')} />
            </Field>
            <Field label={t('dialog.lng')} error={fieldError(errors.lng?.message, { min: -180, max: 180 })}>
              <Input inputMode="decimal" {...register('lng')} />
            </Field>
            <Field className="sm:col-span-2" label={t('dialog.address')} error={fieldError(errors.address?.message, { max: 255 })}>
              <Input {...register('address')} />
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
