import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRoundIcon } from 'lucide-react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox, Label, Switch } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DISCIPLINES, type Discipline } from '@/lib/enums'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import { type Permission } from '@/lib/permissions'
import type { AdminUser } from '@/types/api'

import { useCreateUserMutation, useGetRolesQuery, useSendPasswordResetMutation, useUpdateUserMutation } from '../api'
import { useRoleLabel } from '../roleLabel'

import { PermissionPicker } from './PermissionPicker'

function schemaFor(creating: boolean) {
  return z.object({
    name: z.string().trim().min(1, 'validation:required').max(120, 'validation:max'),
    email: z.email('validation:email'),
    password: creating
      ? z.string().min(8, 'validation:min')
      : z.string().refine((v) => v === '' || v.length >= 8, 'validation:min'),
    job_title: z.string().max(120, 'validation:max'),
    role_id: z.number({ error: 'validation:required' }).int().positive('validation:required'),
    direct_permissions: z.array(z.custom<Permission>()),
    disciplines: z.array(z.custom<Discipline>()),
    is_active: z.boolean(),
  })
}

export type UserFormValues = z.infer<ReturnType<typeof schemaFor>>

/** Create / edit a user: role, extra direct permissions, disciplines, active flag. */
export function UserFormDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user?: AdminUser | null }) {
  const { t } = useTranslation(['admin', 'common', 'enums'])
  const fieldError = useFieldError()
  const roleLabel = useRoleLabel()
  const disciplinesId = useId()
  const creating = !user
  const { data: roles = [] } = useGetRolesQuery()
  const [createUser, createState] = useCreateUserMutation()
  const [updateUser, updateState] = useUpdateUserMutation()
  const [sendReset, resetState] = useSendPasswordResetMutation()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schemaFor(creating)),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      job_title: user?.job_title ?? '',
      role_id: user?.roles[0]?.id ?? 0,
      direct_permissions: user?.direct_permissions ?? [],
      disciplines: user?.disciplines ?? [],
      is_active: user?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      job_title: nullable(values.job_title),
      role_id: values.role_id,
      direct_permissions: values.direct_permissions,
      disciplines: values.disciplines,
      is_active: values.is_active,
      ...(values.password ? { password: values.password } : {}),
    }
    const result = user ? await updateUser({ id: user.id, ...payload }) : await createUser(payload)
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    toast.success(t(user ? 'userForm.saved' : 'userForm.created'))
    onClose()
  })

  const err = (m: string | undefined, values?: Record<string, number>) => fieldError(m, values)
  const busy = isSubmitting || createState.isLoading || updateState.isLoading

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader eyebrow={t('eyebrow')} title={t(creating ? 'userForm.createTitle' : 'userForm.editTitle')} description={user?.email} />
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void submit(e)} noValidate>
          <DialogBody className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('userForm.name')} error={err(errors.name?.message, { max: 120 })}>
                <Input autoComplete="off" {...register('name')} />
              </Field>
              <Field label={t('userForm.email')} error={err(errors.email?.message)}>
                <Input type="email" autoComplete="off" {...register('email')} />
              </Field>
              <Field
                label={t('userForm.password')}
                error={err(errors.password?.message, { min: 8 })}
                hint={creating ? undefined : t('userForm.passwordHintEdit')}
              >
                <Input type="password" autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label={t('userForm.jobTitle')} error={err(errors.job_title?.message, { max: 120 })}>
                <Input {...register('job_title')} />
              </Field>
              <Controller
                control={control}
                name="role_id"
                render={({ field }) => (
                  <Field label={t('userForm.role')} error={err(errors.role_id?.message)}>
                    <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('userForm.selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {roleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <div className="flex items-end">
                    <label className="flex h-10 cursor-pointer items-center gap-3 text-[13px]">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      {t('userForm.isActive')}
                    </label>
                  </div>
                )}
              />
            </div>

            <Controller
              control={control}
              name="disciplines"
              render={({ field }) => (
                <fieldset aria-describedby={`${disciplinesId}-hint`}>
                  <Label asChild>
                    <legend>{t('userForm.disciplines')}</legend>
                  </Label>
                  <p id={`${disciplinesId}-hint`} className="mt-1 text-[11.5px] text-muted-foreground">
                    {t('userForm.disciplinesHint')}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {DISCIPLINES.map((d) => {
                      const checked = field.value.includes(d)
                      return (
                        <label
                          key={d}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-secondary/30 px-3 py-1.5 text-[12px] has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:text-primary"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => field.onChange(c === true ? [...field.value, d] : field.value.filter((x) => x !== d))}
                          />
                          {t(`enums:discipline.${d}`)}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )}
            />

            <Controller
              control={control}
              name="direct_permissions"
              render={({ field }) => (
                <div>
                  <p className="micro-label">{t('userForm.directPermissions')}</p>
                  <p className="mt-1 mb-2.5 text-[11.5px] text-muted-foreground">{t('userForm.directPermissionsHint')}</p>
                  <PermissionPicker value={field.value} onChange={field.onChange} compact />
                </div>
              )}
            />
          </DialogBody>
          <DialogFooter className="sm:justify-between">
            {user ? (
              <Button
                variant="ghost"
                disabled={resetState.isLoading}
                onClick={() => {
                  void sendReset(user.id).then((r) => {
                    if (!('error' in r)) toast.success(t('userForm.resetSent'))
                  })
                }}
              >
                <KeyRoundIcon />
                {t('userForm.sendReset')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="ghost" onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {t('common:actions.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
