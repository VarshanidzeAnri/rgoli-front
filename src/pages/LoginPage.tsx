import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Field, Logo, Pill, UserAvatar } from '@/components/kit'
import { LanguageSwitch, ThemeToggle } from '@/components/layout/TopbarControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetConfigQuery, useGetDemoAccountsQuery, useGetPublicStatsQuery } from '@/features/workspace/api'
import { useAppDispatch } from '@/store'
import { login } from '@/store/authSlice'

const schema = z.object({
  email: z.email('validation:email'),
  password: z.string().min(1, 'validation:required'),
})
type LoginValues = z.infer<typeof schema>

const DEMO_ROLES = ['owner', 'project_manager', 'interior_designer', 'finance_manager'] as const
type DemoRole = (typeof DEMO_ROLES)[number]
const isDemoRole = (r: string): r is DemoRole => (DEMO_ROLES as readonly string[]).includes(r)

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common', 'validation'])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { data: config } = useGetConfigQuery()
  const { data: stats } = useGetPublicStatsQuery()
  const { data: demo } = useGetDemoAccountsQuery(undefined, { skip: !config?.demo })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    const result = await dispatch(login(values))
    if (login.fulfilled.match(result)) {
      void navigate(from, { replace: true })
    } else {
      setFormError(result.payload?.status === 422 ? t('wrongCreds') : (result.payload?.message ?? t('common:errors.generic')))
    }
  })

  const fieldError = (key: string | undefined) => (key ? t(key as 'validation:required') : undefined)

  return (
    <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="absolute top-5 right-4 flex items-center gap-2 sm:right-6">
        <LanguageSwitch />
        <ThemeToggle />
      </div>

      {/* Left: story */}
      <section className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-success uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          {t('common:brand.systemOnline')}
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-foreground via-primary to-info bg-clip-text text-[28px] leading-tight font-semibold text-transparent sm:text-[44px]">
          {t('welcome')}
        </h1>
        <p className="mt-3 text-sm text-primary">{t('common:brand.tagline')}</p>
        <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">{t('description')}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(['projects', 'board', 'finance', 'map'] as const).map((f) => (
            <Pill key={f} tone="primary">
              {t(`features.${f}`)}
            </Pill>
          ))}
        </div>
        <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
          {(
            [
              ['activeProjects', stats?.active_projects],
              ['openTasks', stats?.open_tasks],
              ['team', stats?.team_members],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-border/60 bg-card/40 p-3 backdrop-blur">
              <dd className="num text-xl font-semibold">{value ?? '—'}</dd>
              <dt className="mt-1 text-[11px] text-muted-foreground">{t(`stats.${key}`)}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Right: form */}
      <section className="glass animate-fade-up p-6 sm:p-8">
        <Logo />
        <h2 className="mt-6 text-lg font-semibold">{t('loginTitle')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('loginSubtitle')}</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
          <Field label={t('email')} error={fieldError(errors.email?.message)}>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input type="email" autoComplete="username" className="pl-9" {...register('email')} />
            </div>
          </Field>
          <Field label={t('password')} error={fieldError(errors.password?.message)}>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-10 pl-9" {...register('password')} />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </Field>

          {formError ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
            {isSubmitting ? t('signingIn') : t('signIn')}
          </Button>
          <Link to="/forgot-password" className="self-center text-xs text-muted-foreground hover:text-primary">
            {t('forgotPassword')}
          </Link>
        </form>

        {config?.demo && demo && demo.length > 0 ? (
          <div className="mt-6 border-t border-border/60 pt-5">
            <p className="micro-label">{t('demo.title')}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('demo.hint')}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {demo.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-2.5 text-left transition hover:border-primary/50"
                    onClick={() => {
                      setValue('email', account.email)
                      setValue('password', account.password)
                      void submit()
                    }}
                  >
                    <UserAvatar user={{ name: account.email, avatar_url: null }} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px]">{isDemoRole(account.role) ? t(`roles.${account.role}`) : account.role}</span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">{account.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  )
}
