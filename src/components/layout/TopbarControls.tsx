import {
  BanknoteIcon,
  BellIcon,
  FolderPlusIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  SquarePlusIcon,
  SunIcon,
  UploadIcon,
  UserIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/kit'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/workspace/api'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { isLocale, LOCALES } from '@/lib/enums'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout, selectUser } from '@/store/authSlice'
import { openDialog, selectLocale, selectTheme, setLocale, toggleTheme } from '@/store/uiSlice'

export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const locale = useAppSelector(selectLocale)
  return (
    <div role="radiogroup" aria-label={t('language.label')} className={cn('flex rounded-full border border-border/70 bg-secondary/30 p-0.5', className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          aria-label={t(`language.${l}`)}
          onClick={() => dispatch(setLocale(l))}
          className={cn(
            'h-7 rounded-full px-2.5 font-mono text-[10.5px] tracking-wider transition',
            locale === l ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`language.short.${l}`)}
        </button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const theme = useAppSelector(selectTheme)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => dispatch(toggleTheme())}
      aria-label={t('theme.toggle')}
      title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export function QuickAddMenu() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const items = [
    { kind: 'project' as const, label: t('quickAdd.project'), icon: FolderPlusIcon, allowed: useCan('projects.create') },
    { kind: 'issue' as const, label: t('quickAdd.issue'), icon: SquarePlusIcon, allowed: useCan('issues.create') },
    { kind: 'file' as const, label: t('quickAdd.file'), icon: UploadIcon, allowed: useCan('files.upload') },
    { kind: 'salaryRequest' as const, label: t('quickAdd.salaryRequest'), icon: BanknoteIcon, allowed: useCan('salary.request') },
  ].filter((i) => i.allowed)

  if (items.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="primary" size="sm" className="hidden sm:inline-flex">
          <PlusIcon />
          {t('quickAdd.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('quickAdd.title')}</DropdownMenuLabel>
        {items.map(({ kind, label, icon: Icon }) => (
          <DropdownMenuItem key={kind} onSelect={() => dispatch(openDialog({ kind }))}>
            <Icon />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NotificationsBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const f = useFormat()
  const { data } = useGetNotificationsQuery(undefined, { pollingInterval: 60_000 })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll] = useMarkAllNotificationsReadMutation()
  const unread = data?.meta.unread ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`${t('notifications.title')}${unread ? ` · ${t('notifications.unread', { count: unread })}` : ''}`}>
          <BellIcon />
          {unread > 0 ? (
            <span className="num absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-[13px] font-semibold">{t('notifications.title')}</p>
          {unread > 0 ? (
            <Button variant="link" size="sm" className="h-auto px-0" onClick={() => void markAll()}>
              {t('notifications.markAll')}
            </Button>
          ) : null}
        </div>
        <ul className="max-h-96 overflow-y-auto p-1.5">
          {data && data.data.length > 0 ? (
            data.data.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary/60"
                  onClick={() => {
                    if (!n.read_at) void markRead(n.id)
                    if (n.link?.startsWith('/')) void navigate(n.link)
                  }}
                >
                  <span aria-hidden className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-primary')} />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] leading-snug">{n.message}</span>
                    {n.created_at ? <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{f.relative(n.created_at)}</span> : null}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-8 text-center text-xs text-muted-foreground">{t('notifications.empty')}</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export function UserMenu() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectUser)
  const locale = useAppSelector(selectLocale)
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('userMenu.label')}>
          <UserAvatar user={user} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate('/profile')}>
          <UserIcon />
          {t('userMenu.profile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="sm:hidden" />
        <DropdownMenuLabel className="sm:hidden">{t('language.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup className="sm:hidden" value={locale} onValueChange={(v) => isLocale(v) && dispatch(setLocale(v))}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {t(`language.${l}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void dispatch(logout()).then(() => navigate('/login', { replace: true }))
          }}
        >
          <LogOutIcon />
          {t('userMenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
