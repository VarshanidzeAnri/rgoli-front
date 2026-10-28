import { Link } from 'react-router'

import { AvatarStack, PriorityPill, StatusPill } from '@/components/kit'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import { isOverdue } from '@/lib/format'
import type { Issue } from '@/types/api'

/** Compact task row linking to the board drawer. Used on the dashboard and project page. */
export function IssueRow({ issue, showProject = true, showStatus = false }: { issue: Issue; showProject?: boolean; showStatus?: boolean }) {
  const f = useFormat()
  const overdue = issue.status !== 'done' && isOverdue(issue.due_date)
  return (
    <Link
      to={`/board?issue=${issue.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-border/50 bg-secondary/20 px-3.5 py-2.5 transition hover:border-primary/40"
    >
      <span className="num text-[10.5px] text-muted-foreground">{issue.key}</span>
      <span className="min-w-0 flex-1 truncate text-[13px]">{issue.title}</span>
      {showProject ? <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{issue.project.name}</span> : null}
      {showStatus ? <StatusPill status={issue.status} /> : null}
      <PriorityPill priority={issue.priority} />
      {issue.due_date ? (
        <time dateTime={issue.due_date} className={cn('num text-[11px]', overdue ? 'text-danger' : 'text-muted-foreground')}>
          {f.date(issue.due_date, false)}
        </time>
      ) : null}
      {issue.assignees && issue.assignees.length > 0 ? <AvatarStack users={issue.assignees} size="xs" /> : null}
    </Link>
  )
}
