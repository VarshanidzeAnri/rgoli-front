import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClockIcon } from 'lucide-react'
import { type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarStack, PriorityPill } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { isOverdue } from '@/lib/format'
import type { Issue } from '@/types/api'

/** Presentational card (also used in the drag overlay). */
export function IssueCardBody({ issue, dragging = false }: { issue: Issue; dragging?: boolean }) {
  const { t } = useTranslation(['board', 'common'])
  const f = useFormat()
  const overdue = issue.status !== 'done' && isOverdue(issue.due_date)
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card/80 p-3.5 text-left shadow-sm backdrop-blur transition hover:border-primary/40',
        dragging && 'rotate-1 border-primary/60 shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.6)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] tracking-wider text-primary">{issue.key}</span>
        <PriorityPill priority={issue.priority} />
      </div>
      <p className="mt-2 line-clamp-3 text-[13px] leading-snug font-medium">{issue.title}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{issue.project.name}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 text-[11px]">
          {issue.due_date ? (
            <span className={cn('inline-flex items-center gap-1 font-mono', overdue ? 'text-destructive' : 'text-muted-foreground')}>
              <CalendarClockIcon className="size-3.5" aria-hidden />
              {f.date(issue.due_date, false)}
              {overdue ? <span className="sr-only">{t('common:overdue')}</span> : null}
            </span>
          ) : null}
          <span className="num rounded-md border border-border/70 px-1.5 text-muted-foreground" title={t('common:fields.points')}>
            {issue.points}
          </span>
        </div>
        {issue.assignees && issue.assignees.length > 0 ? <AvatarStack users={issue.assignees} max={3} size="xs" /> : null}
      </div>
    </div>
  )
}

/** Sortable card. Click/Enter opens the task; Space starts a keyboard drag. */
export function IssueCard({ issue, canMove, onOpen }: { issue: Issue; canMove: boolean; onOpen: (id: number) => void }) {
  const { t } = useTranslation('board')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id, disabled: !canMove })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onOpen(issue.id)
      return
    }
    listeners?.onKeyDown?.(e)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t('card.open', { key: issue.key, title: issue.title })}
      aria-disabled={undefined}
      title={canMove ? undefined : t('card.dragDisabled')}
      onClick={() => onOpen(issue.id)}
      className={cn(
        'touch-manipulation rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring',
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-40',
      )}
    >
      <IssueCardBody issue={issue} />
    </div>
  )
}
