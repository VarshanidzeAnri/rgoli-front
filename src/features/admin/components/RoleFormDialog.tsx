import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { applyServerErrors, useFieldError } from '@/lib/forms'
import type { Role } from '@/types/api'

import { useCreateRoleMutation, useUpdateRoleMutation } from '../api'

const schema = z.object({ name: z.string().trim().min(1, 'validation:required').max(80, 'validation:max') })

/** Create a role (empty permissions) or rename an existing one. */
export function RoleFormDialog({ open, onClose, role, onCreated }: { open: boolean; onClose: () => void; role?: Role | null; onCreated?: (role: Role) => void }) {
  const { t } = useTranslation(['admin', 'common'])
  const fieldError = useFieldError()
  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: role?.name ?? '' } })

  const submit = handleSubmit(async ({ name }) => {
    const result = role ? await updateRole({ id: role.id, name }) : await createRole({ name, permissions: [] })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t(role ? 'roles.saved' : 'roles.created'))
    if (!role) onCreated?.(result.data)
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader eyebrow={t('eyebrow')} title={t(role ? 'roles.renameTitle' : 'roles.createTitle')} />
        <form onSubmit={(e) => void submit(e)} noValidate>
          <DialogBody>
            <Field label={t('roles.name')} error={fieldError(errors.name?.message, { max: 80 })}>
              <Input {...register('name')} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {t('common:actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
