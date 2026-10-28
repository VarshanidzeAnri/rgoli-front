import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import { gradientFor } from '@/lib/tones'
import type { UserSummary } from '@/types/api'

const SIZES = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-base', xl: 'size-20 text-2xl' } as const

export function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: Pick<UserSummary, 'name' | 'avatar_url'>
  size?: keyof typeof SIZES
  className?: string
}) {
  const { t } = useTranslation()
  const initial = user.name.trim().charAt(0).toUpperCase() || '?'
  const label = t('a11y.avatarOf', { name: user.name })

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={label}
        loading="lazy"
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-background', SIZES[size], className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={user.name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-primary-foreground ring-2 ring-background',
        gradientFor(user.name),
        SIZES[size],
        className,
      )}
    >
      {initial}
    </span>
  )
}

export function AvatarStack({ users, max = 3, size = 'sm' }: { users: UserSummary[]; max?: number; size?: keyof typeof SIZES }) {
  const { t } = useTranslation()
  const shown = users.slice(0, max)
  const rest = users.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((user) => (
        <UserAvatar key={user.id} user={user} size={size} />
      ))}
      {rest > 0 ? (
        <span
          className={cn('inline-flex items-center justify-center rounded-full bg-secondary font-mono text-muted-foreground ring-2 ring-background', SIZES[size])}
          aria-label={t('a11y.moreUsers', { count: rest })}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
