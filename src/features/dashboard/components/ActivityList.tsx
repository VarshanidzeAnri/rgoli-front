import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import type { Activity } from '@/types/api'

const VERBS = ['created', 'updated', 'deleted', 'moved'] as const
const SUBJECTS = ['project', 'phase', 'issue', 'sprint', 'comment', 'file', 'client_payment', 'salary_request'] as const

type Verb = (typeof VERBS)[number]
type Subject = (typeof SUBJECTS)[number] | 'other'

const asVerb = (event: string): Verb => ((VERBS as readonly string[]).includes(event) ? (event as Verb) : 'updated')
const asSubject = (type: string): Subject => ((SUBJECTS as readonly string[]).includes(type) ? (type as Subject) : 'other')

/** Activity timeline; the newest entry gets a glowing dot. */
export function ActivityList({ items, showProject = true }: { items: Activity[]; showProject?: boolean }) {
  const { t } = useTranslation('dashboard')
  const f = useFormat()

  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border/70">
      {items.map((item, index) => {
        const user = item.user?.name ?? t('activity.system')
        const fields = item.event === 'updated' && item.meta.fields?.length ? item.meta.fields.join(', ') : null
        return (
          <li key={item.id} className="relative flex gap-3 pl-0">
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center">
              {item.user ? (
                <UserAvatar user={item.user} size="xs" />
              ) : (
                <span className="size-2 rounded-full bg-muted-foreground" aria-hidden />
              )}
              {index === 0 ? (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-[12.5px] leading-snug', index === 0 && 'text-foreground')}>
                {t('activity.line', {
                  user,
                  verb: t(`activity.verb.${asVerb(item.event)}`),
                  subject: t(`activity.subject.${asSubject(item.subject_type)}`),
                })}
                {item.meta.label ? <span className="font-medium text-primary"> {item.meta.label}</span> : null}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10.5px] text-muted-foreground">
                <time dateTime={item.created_at}>{f.relative(item.created_at)}</time>
                {showProject && item.project ? <span>{item.project.key}</span> : null}
                {fields ? <span>{t('activity.changed', { fields })}</span> : null}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
