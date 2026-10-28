import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Field, Logo } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useResetPasswordMutation } from '@/features/profile/api'
import { isApiError } from '@/store/api'

const schema = z
  .object({
    password: z.string().min(8, 'validation:min'),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'validation:passwordsMatch' })

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reset, { isLoading }] = useResetPasswordMutation()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (values) => {
    setError(null)
    const result = await reset({ ...values, token, email })
    if ('error' in result) setError(isApiError(result.error) ? result.error.message : t('reset.invalidLink'))
    else setDone(true)
  })

  const msg = (m?: string) => (m ? t(m as 'validation:min', { min: 8 }) : undefined)

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <section className="glass w-full max-w-md animate-fade-up p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-lg font-semibold">{t('reset.title')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t('reset.subtitle')}</p>
        {!token || !email ? (
          <p role="alert" className="mt-6 text-xs text-destructive">
            {t('reset.invalidLink')}
          </p>
        ) : done ? (
          <p role="status" className="mt-6 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-xs text-success">
            {t('reset.done')}
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
            <Field label={t('reset.password')} error={msg(formState.errors.password?.message)}>
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </Field>
            <Field label={t('reset.confirm')} error={msg(formState.errors.password_confirmation?.message)}>
              <Input type="password" autoComplete="new-password" {...register('password_confirmation')} />
            </Field>
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
              {t('reset.submit')}
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-block text-xs text-muted-foreground hover:text-primary">
          {t('forgot.back')}
        </Link>
      </section>
    </div>
  )
}
