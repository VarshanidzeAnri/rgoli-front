import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Field, Logo } from '@/components/kit'
import { LanguageSwitch } from '@/components/layout/TopbarControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForgotPasswordMutation } from '@/features/profile/api'

const schema = z.object({ email: z.email('validation:email') })

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'validation'])
  const [sent, setSent] = useState(false)
  const [send, { isLoading }] = useForgotPasswordMutation()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (values) => {
    await send(values)
    setSent(true)
  })

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="absolute top-5 right-4">
        <LanguageSwitch />
      </div>
      <section className="glass w-full max-w-md animate-fade-up p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-lg font-semibold">{t('forgot.title')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t('forgot.subtitle')}</p>
        {sent ? (
          <p role="status" className="mt-6 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-xs text-success">
            {t('forgot.sent')}
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
            <Field label={t('email')} error={formState.errors.email?.message ? t(formState.errors.email.message as 'validation:email') : undefined}>
              <Input type="email" autoComplete="email" {...register('email')} />
            </Field>
            <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
              {t('forgot.submit')}
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
