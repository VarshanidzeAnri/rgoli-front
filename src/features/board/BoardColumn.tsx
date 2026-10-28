import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Can } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { STATUS_TONE, type Status } from '@/lib/enums'
import { TONE_DOT } from '@/lib/tones'
import type { Issue } from '@/types/api'

import { columnDroppableId } from './boardState'
import { IssueCard } from './IssueCard'

export function BoardColumn({
  status,
  issues,
  canMove,
  onOpen,
  onAdd,
}: {
  status: Status
  issues: Issue[]
  canMove: boolean
  onOpen: (id: number) => void
  onAdd: (status: Status) => void
}) {
  const { t } = useTranslation(['board', 'enums'])
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(status) })
  const label = t(`enums:status.${status}`)

  return (
    <section
      aria-label={t('column.label', { status: label, count: issues.length })}
      className="glass flex w-[280px] shrink-0 flex-col rounded-[22px] sm:w-[300px] xl:w-auto xl:min-w-0 xl:flex-1"
    >
      <header className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <span aria-hidden className={cn('size-2 rounded-full shadow-[0_0_8px_currentColor]', TONE_DOT[STATUS_TONE[status]])} />
        <h2 className="text-[13px] font-semibold">{label}</h2>
        <span className="num rounded-full bg-secondary/60 px-2 text-[10.5px] text-muted-foreground">{issues.length}</span>
        <Can permission="issues.create">
          <Button size="icon-sm" variant="ghost" className="ml-auto" onClick={() => onAdd(status)} aria-label={t('column.add', { status: label })}>
            <PlusIcon />
          </Button>
        </Can>
      </header>
      <SortableContext id={status} items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn('flex min-h-40 flex-1 flex-col gap-2.5 p-3 transition-colors', isOver && 'rounded-b-[22px] bg-primary/5')}
        >
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} canMove={canMove} onOpen={onOpen} />
          ))}
          {issues.length === 0 ? (
            <p className="m-auto rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-[11.5px] text-muted-foreground">
              {t('column.empty')}
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  )
}
