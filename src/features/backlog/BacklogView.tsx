import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { CheckCheckIcon, GripVerticalIcon, PencilIcon, PlayIcon, PlusIcon, Trash2Icon, UndoIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AvatarStack, Can, ConfirmDialog, EmptyState, ErrorState, ListSkeleton, Panel, Pill, PriorityPill, ProgressBar, StatusPill } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { useGetIssuesQuery } from '@/features/issues/api'
import {
  useAddIssuesToSprintMutation,
  useDeleteSprintMutation,
  useGetSprintsQuery,
  useRemoveIssueFromSprintMutation,
  useStartSprintMutation,
} from '@/features/sprints/api'
import { useCan } from '@/hooks/useCan'
import { useFormat } from '@/hooks/useFormat'
import { cn } from '@/lib/cn'
import type { SprintState, Tone } from '@/lib/enums'
import type { Issue, Sprint } from '@/types/api'

import { CompleteSprintDialog } from './CompleteSprintDialog'
import { SprintFormDialog } from './SprintFormDialog'

const STATE_TONE: Record<SprintState, Tone> = { active: 'primary', planned: 'info', completed: 'success' }
const sprintDropId = (id: number) => `sprint:${id}`

function IssueRow({ issue, draggable, onOpen, action }: { issue: Issue; draggable: boolean; onOpen: (id: number) => void; action?: React.ReactNode }) {
  const { t } = useTranslation('board')
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: issue.id, disabled: !draggable })
  return (
    <li ref={setNodeRef} className={cn('flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-2.5 py-2', isDragging && 'opacity-40')}>
      {draggable ? (
        <span {...attributes} {...listeners} className="cursor-grab touch-none rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('card.open', { key: issue.key, title: issue.title })}>
          <GripVerticalIcon className="size-4" aria-hidden />
        </span>
      ) : null}
      <button type="button" onClick={() => onOpen(issue.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none focus-visible:underline">
        <span className="font-mono text-[10.5px] text-primary">{issue.key}</span>
        <span className="truncate text-[12.5px]">{issue.title}</span>
      </button>
      <span className="hidden items-center gap-2 sm:flex">
        <StatusPill status={issue.status} />
        <PriorityPill priority={issue.priority} />
        <span className="num w-6 text-right text-[11px] text-muted-foreground">{issue.points}</span>
        {issue.assignees && issue.assignees.length > 0 ? <AvatarStack users={issue.assignees} max={2} size="xs" /> : null}
      </span>
      {action}
    </li>
  )
}

function SprintPanel({
  sprint,
  canManage,
  onOpen,
  onEdit,
  onComplete,
  onDelete,
}: {
  sprint: Sprint
  canManage: boolean
  onOpen: (id: number) => void
  onEdit: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation(['backlog', 'enums', 'common'])
  const f = useFormat()
  const open = sprint.state !== 'completed'
  const { setNodeRef, isOver } = useDroppable({ id: sprintDropId(sprint.id), disabled: !open || !canManage })
  const [start, startState] = useStartSprintMutation()
  const [remove] = useRemoveIssueFromSprintMutation()
  const stats = sprint.stats ?? { total: 0, done: 0, points_total: 0, points_done: 0 }
  const percent = stats.total ? (stats.done / stats.total) * 100 : 0

  return (
    <Panel
      eyebrow={t('dates', { start: f.date(sprint.start_date, false), end: f.date(sprint.end_date) })}
      title={
        <span className="flex items-center gap-2">
          {sprint.name}
          <Pill tone={STATE_TONE[sprint.state]} dot>
            {t(`enums:sprint_state.${sprint.state}`)}
          </Pill>
        </span>
      }
      actions={
        canManage && open ? (
          <>
            {sprint.state === 'planned' ? (
              <Button
                size="sm"
                variant="primary"
                disabled={startState.isLoading}
                onClick={() =>
                  void start(sprint.id).then((r) => {
                    if (!('error' in r)) toast.success(t('started'))
                  })
                }
              >
                <PlayIcon />
                {t('start')}
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={onComplete}>
                <CheckCheckIcon />
                {t('complete')}
              </Button>
            )}
            <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={t('editSprint')}>
              <PencilIcon />
            </Button>
            {sprint.state === 'planned' ? (
              <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label={t('common:actions.delete')}>
                <Trash2Icon />
              </Button>
            ) : null}
          </>
        ) : null
      }
      className={cn(isOver && 'border-primary/60')}
    >
      {sprint.goal ? <p className="mb-3 text-[12.5px] text-muted-foreground">{sprint.goal}</p> : null}
      <div className="mb-3 flex items-center gap-3">
        <ProgressBar value={percent} variant={sprint.state === 'completed' ? 'success' : 'primary'} label={sprint.name} />
        <span className="num shrink-0 text-[11px] text-muted-foreground">
          {t('progress', { done: stats.done, total: stats.total, pointsDone: stats.points_done, pointsTotal: stats.points_total })}
        </span>
      </div>
      <ul ref={setNodeRef} className={cn('flex min-h-14 flex-col gap-1.5 rounded-xl transition', isOver && 'bg-primary/5 p-1')}>
        {sprint.issues?.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            draggable={false}
            onOpen={onOpen}
            action={
              canManage && open ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t('removeLabel', { title: issue.title })}
                  title={t('remove')}
                  onClick={() =>
                    void remove({ id: sprint.id, issueId: issue.id }).then((r) => {
                      if (!('error' in r)) toast.success(t('removed'))
                    })
                  }
                >
                  <UndoIcon />
                </Button>
              ) : undefined
            }
          />
        ))}
        {!sprint.issues?.length ? (
          <li className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-center text-[11.5px] text-muted-foreground">
            {open && canManage ? t('dropHere') : t('sprintEmpty')}
          </li>
        ) : null}
      </ul>
    </Panel>
  )
}

export function BacklogView({ onOpen }: { onOpen: (id: number) => void }) {
  const { t } = useTranslation(['backlog', 'common'])
  const canManage = useCan('sprints.manage')
  const backlog = useGetIssuesQuery({ backlog: true, per_page: 100 })
  const sprints = useGetSprintsQuery()
  const [addIssues] = useAddIssuesToSprintMutation()
  const [deleteSprint, deleteState] = useDeleteSprintMutation()
  const [editing, setEditing] = useState<Sprint | 'new' | null>(null)
  const [completing, setCompleting] = useState<Sprint | null>(null)
  const [deleting, setDeleting] = useState<Sprint | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const backlogIssues = useMemo(() => backlog.data?.data ?? [], [backlog.data])
  const allSprints = useMemo(() => sprints.data ?? [], [sprints.data])
  const planned = allSprints.filter((s) => s.state === 'planned')
  const titleOf = (id: UniqueIdentifier) => backlogIssues.find((i) => i.id === Number(id))?.title ?? ''
  const sprintName = (id: UniqueIdentifier | undefined) => allSprints.find((s) => sprintDropId(s.id) === id)?.name ?? ''

  const announcements: Announcements = {
    onDragStart: ({ active }) => t('drag.pickup', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) => (over ? t('drag.over', { title: titleOf(active.id), target: sprintName(over.id) }) : undefined),
    onDragEnd: ({ active, over }) => (over ? t('drag.drop', { title: titleOf(active.id), target: sprintName(over.id) }) : t('drag.cancel')),
    onDragCancel: () => t('drag.cancel'),
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || typeof over.id !== 'string' || !over.id.startsWith('sprint:')) return
    const sprintId = Number(over.id.slice('sprint:'.length))
    void addIssues({ id: sprintId, issue_ids: [Number(active.id)] }).then((r) => {
      if (!('error' in r)) toast.success(t('added'))
    })
  }

  const active = activeId === null ? undefined : backlogIssues.find((i) => i.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active: a }) => setActiveId(Number(a.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t('drag.instructions') } }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={t('backlog')} eyebrow={t('common:counts.tasks', { count: backlogIssues.length })}>
          {backlog.isLoading ? (
            <ListSkeleton />
          ) : backlog.isError ? (
            <ErrorState onRetry={() => void backlog.refetch()} />
          ) : backlogIssues.length === 0 ? (
            <EmptyState text={t('backlogEmpty')} />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {backlogIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} draggable={canManage} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </Panel>

        <section aria-label={t('sprints')} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="micro-label">{t('sprints')}</h2>
            <Can permission="sprints.manage">
              <Button size="sm" onClick={() => setEditing('new')}>
                <PlusIcon />
                {t('newSprint')}
              </Button>
            </Can>
          </div>
          {sprints.isLoading ? (
            <ListSkeleton rows={3} />
          ) : sprints.isError ? (
            <ErrorState onRetry={() => void sprints.refetch()} />
          ) : allSprints.length === 0 ? (
            <Panel>
              <EmptyState text={t('noSprints')} />
            </Panel>
          ) : (
            allSprints.map((sprint) => (
              <SprintPanel
                key={sprint.id}
                sprint={sprint}
                canManage={canManage}
                onOpen={onOpen}
                onEdit={() => setEditing(sprint)}
                onComplete={() => setCompleting(sprint)}
                onDelete={() => setDeleting(sprint)}
              />
            ))
          )}
        </section>
      </div>

      <DragOverlay>
        {active ? (
          <div className="rounded-xl border border-primary/60 bg-card px-3 py-2 text-[12.5px] shadow-xl">
            <span className="mr-2 font-mono text-[10.5px] text-primary">{active.key}</span>
            {active.title}
          </div>
        ) : null}
      </DragOverlay>

      {editing ? <SprintFormDialog sprint={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} /> : null}
      {completing ? <CompleteSprintDialog sprint={completing} planned={planned} onClose={() => setCompleting(null)} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        description={t('common:confirm.deleteText', { name: deleting?.name ?? '' })}
        loading={deleteState.isLoading}
        onConfirm={() => {
          if (!deleting) return
          void deleteSprint(deleting.id).then((r) => {
            if (!('error' in r)) {
              toast.success(t('deleted'))
              setDeleting(null)
            }
          })
        }}
      />
    </DndContext>
  )
}
