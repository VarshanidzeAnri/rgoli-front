import { zodResolver } from '@hookform/resolvers/zod'
import { ImageUpIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { DisciplinePill, Field, PageHero, Panel, Pill, UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoleLabel } from '@/features/admin/roleLabel'
import { AVATAR_TYPES, avatarError } from '@/features/profile/avatar'
import { useChangePasswordMutation, useUpdateProfileMutation, useUploadAvatarMutation } from '@/features/profile/api'
import { cn } from '@/lib/cn'
import { LOCALES, THEMES } from '@/lib/enums'
import { applyServerErrors, nullable, useFieldError } from '@/lib/forms'
import { PERMISSION_GROUP_KEYS, PERMISSION_GROUPS } from '@/lib/permissions'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectAuth } from '@/store/authSlice'
import { selectLocale, selectTheme, setLocale, setTheme } from '@/store/uiSlice'

const detailsSchema = z.object({
  name: z.string().trim().min(1, 'validation:required').max(120, 'validation:max'),
  job_title: z.string().max(120, 'validation:max'),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'validation:required'),
    password: z.string().min(8, 'validation:min'),
    password_confirmation: z.string().min(1, 'validation:required'),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'validation:passwordsMatch' })

function DetailsForm() {
  const { t } = useTranslation(['profile', 'common'])
  const fieldError = useFieldError()
  const { user } = useAppSelector(selectAuth)
  const [updateProfile] = useUpdateProfileMutation()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: user?.name ?? '', job_title: user?.job_title ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    const result = await updateProfile({ name: values.name.trim(), job_title: nullable(values.job_title) })
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    reset(values)
    toast.success(t('details.saved'))
  })

  return (
    <Panel title={t('details.title')}>
      <form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <Field label={t('details.name')} error={fieldError(errors.name?.message, { max: 120 })}>
          <Input autoComplete="name" {...register('name')} />
        </Field>
        <Field label={t('details.jobTitle')} error={fieldError(errors.job_title?.message, { max: 120 })}>
          <Input autoComplete="organization-title" {...register('job_title')} />
        </Field>
        <Field label={t('details.email')}>
          <Input value={user?.email ?? ''} readOnly disabled />
        </Field>
        <Button type="submit" variant="primary" className="self-start" disabled={isSubmitting || !isDirty}>
          {t('details.save')}
        </Button>
      </form>
    </Panel>
  )
}

function AvatarForm() {
  const { t } = useTranslation('profile')
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAppSelector(selectAuth)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [upload, { isLoading }] = useUploadAvatarMutation()

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  if (!user) return null

  return (
    <Panel title={t('avatar.title')}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {preview ? (
          <img src={preview} alt={t('avatar.preview')} className="size-20 rounded-full object-cover ring-2 ring-primary/40" />
        ) : (
          <UserAvatar user={user} size="xl" />
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="sr-only"
            aria-label={t('avatar.choose')}
            aria-describedby={`${inputId}-hint`}
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null
              e.target.value = ''
              if (!picked) return
              const problem = avatarError(picked)
              setError(problem ? t(problem) : null)
              setFile(problem ? null : picked)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()}>
              <ImageUpIcon />
              {t('avatar.choose')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!file || isLoading}
              onClick={() => {
                if (!file) return
                void upload(file).then((r) => {
                  if ('error' in r) {
                    applyServerErrors(r.error, () => undefined)
                    return
                  }
                  setFile(null)
                  toast.success(t('avatar.uploaded'))
                })
              }}
            >
              {t('avatar.upload')}
            </Button>
          </div>
          <p id={`${inputId}-hint`} className="text-[11.5px] text-muted-foreground">
            {t('avatar.hint')}
          </p>
          {error ? (
            <p role="alert" className="text-[11.5px] text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}

function PreferencesPanel() {
  const { t } = useTranslation(['profile', 'common'])
  const dispatch = useAppDispatch()
  const locale = useAppSelector(selectLocale)
  const theme = useAppSelector(selectTheme)

  const segment = (active: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12.5px] transition',
      active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <Panel title={t('preferences.title')} eyebrow={t('preferences.hint')}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="micro-label mb-2" id="pref-language">
            {t('preferences.language')}
          </p>
          <div role="radiogroup" aria-labelledby="pref-language" className="inline-flex flex-wrap rounded-full border border-border/70 bg-secondary/30 p-1">
            {LOCALES.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={locale === l} className={segment(locale === l)} onClick={() => dispatch(setLocale(l))}>
                <span className="font-mono text-[10.5px]">{t(`common:language.short.${l}`)}</span>
                {t(`common:language.${l}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="micro-label mb-2" id="pref-theme">
            {t('preferences.theme')}
          </p>
          <div role="radiogroup" aria-labelledby="pref-theme" className="inline-flex rounded-full border border-border/70 bg-secondary/30 p-1">
            {THEMES.map((th) => (
              <button key={th} type="button" role="radio" aria-checked={theme === th} className={segment(theme === th)} onClick={() => dispatch(setTheme(th))}>
                {th === 'dark' ? <MoonIcon className="size-4" aria-hidden /> : <SunIcon className="size-4" aria-hidden />}
                {t(`common:theme.${th}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function PasswordForm() {
  const { t } = useTranslation('profile')
  const fieldError = useFieldError()
  const [changePassword] = useChangePasswordMutation()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })

  const submit = handleSubmit(async (values) => {
    const result = await changePassword(values)
    if ('error' in result) {
      applyServerErrors(result.error, setError)
      return
    }
    reset()
    toast.success(t('password.changed'))
  })

  return (
    <Panel title={t('password.title')}>
      <form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <Field label={t('password.current')} error={fieldError(errors.current_password?.message)}>
          <Input type="password" autoComplete="current-password" {...register('current_password')} />
        </Field>
        <Field label={t('password.new')} error={fieldError(errors.password?.message, { min: 8 })}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label={t('password.confirm')} error={fieldError(errors.password_confirmation?.message)}>
          <Input type="password" autoComplete="new-password" {...register('password_confirmation')} />
        </Field>
        <Button type="submit" variant="primary" className="self-start" disabled={isSubmitting}>
          {t('password.submit')}
        </Button>
      </form>
    </Panel>
  )
}

function AccessPanel() {
  const { t } = useTranslation(['profile', 'permissions'])
  const roleLabel = useRoleLabel()
  const { roles, disciplines, permissions } = useAppSelector(selectAuth)
  const owned = new Set(permissions)

  return (
    <Panel title={t('access.title')}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="micro-label mb-2">{t('access.roles')}</p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <Pill key={r.id} tone="violet">
                {roleLabel(r)}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <p className="micro-label mb-2">{t('access.disciplines')}</p>
          {disciplines.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {disciplines.map((d) => (
                <DisciplinePill key={d} discipline={d} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('access.noDisciplines')}</p>
          )}
        </div>
        <div>
          <p className="micro-label mb-2">{t('access.permissions')}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {PERMISSION_GROUP_KEYS.map((group) => {
              const mine = PERMISSION_GROUPS[group].filter((p) => owned.has(p))
              if (mine.length === 0) return null
              return (
                <div key={group} className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                  <dt className="text-[12.5px] font-semibold">{t(`permissions:groups.${group}`)}</dt>
                  <dd className="mt-2 flex flex-wrap gap-1">
                    {mine.map((p) => (
                      <Pill key={p} tone="primary" className="text-[10.5px]">
                        {t(`permissions:names.${p}`)}
                      </Pill>
                    ))}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </Panel>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation('profile')
  const { user } = useAppSelector(selectAuth)
  return (
    <div className="flex flex-col gap-5">
      <PageHero eyebrow={t('eyebrow')} title={user?.name ?? t('title')} subtitle={t('subtitle')} meta={user ? <Pill tone="muted">{user.email}</Pill> : null} />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <DetailsForm />
          <AvatarForm />
          <PreferencesPanel />
        </div>
        <div className="flex flex-col gap-5">
          <PasswordForm />
          <AccessPanel />
        </div>
      </div>
    </div>
  )
}
