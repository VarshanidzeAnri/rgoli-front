import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/kit'
import { Skeleton } from '@/components/ui/misc'
import { useGetBoardQuery, useMoveIssueMutation, type IssueListParams } from '@/features/issues/api'
import IssueFormDialog from '@/features/issues/components/IssueFormDialog'
import { useCan } from '@/hooks/useCan'
import { STATUSES, type Status } from '@/lib/enums'

import { BoardColumn } from './BoardColumn'
import { afterIdFor, findColumn, indexIssues, moveBetween, reorderWithin, toColumnIds, type ColumnIds } from './boardState'
import { IssueCardBody } from './IssueCard'

/**
 * Kanban board with @dnd-kit: drag within and across columns (mouse, touch, keyboard).
 * The drop calls moveIssue({ status, after_id }); the cache update is optimistic.
 */
export function BoardView({ params, onOpen }: { params: IssueListParams; onOpen: (id: number) => void }) {
  const { t } = useTranslation(['board', 'enums'])
  const canMove = useCan('issues.move')
  const { data: board, isLoading, isError, refetch } = useGetBoardQuery(params)
  const [moveIssue] = useMoveIssueMutation()
  // Local column order only while dragging; otherwise the (optimistically patched) server board.
  const [dragColumns, setDragColumns] = useState<ColumnIds | null>(null)
  const serverColumns = useMemo(() => toColumnIds(board), [board])
  const columns = dragColumns ?? serverColumns
  const [activeId, setActiveId] = useState<number | null>(null)
  const [createIn, setCreateIn] = useState<Status | null>(null)
  const startColumns = useRef<ColumnIds | null>(null)

  const issues = useMemo(() => indexIssues(board), [board])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens the card, so keyboard drags use Space only.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  const titleOf = (id: UniqueIdentifier) => issues.get(Number(id))?.title ?? ''
  const statusLabel = (id: UniqueIdentifier | undefined) => {
    const status = id === undefined ? null : findColumn(columns, id)
    return status ? t(`enums:status.${status}`) : ''
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => t('dnd.pickup', { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) => (over ? t('dnd.over', { title: titleOf(active.id), status: statusLabel(over.id) }) : undefined),
    onDragEnd: ({ active, over }) => (over ? t('dnd.drop', { title: titleOf(active.id), status: statusLabel(over.id) }) : t('dnd.cancel')),
    onDragCancel: () => t('dnd.cancel'),
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(Number(active.id))
    startColumns.current = columns
    setDragColumns(columns)
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const from = findColumn(columns, active.id)
    const to = findColumn(columns, over.id)
    if (from && to && from !== to) {
      setDragColumns((current) => moveBetween(current ?? columns, Number(active.id), over.id))
    }
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = Number(active.id)
    let next = columns
    if (over) {
      const status = findColumn(columns, active.id)
      if (status && typeof over.id === 'number' && findColumn(columns, over.id) === status) {
        next = reorderWithin(columns, status, id, over.id)
      }
    }
    const before = startColumns.current ? afterIdFor(startColumns.current, id) : null
    const after = afterIdFor(next, id)
    startColumns.current = null
    const changed = over !== null && after !== null && (before?.status !== after.status || before.afterId !== after.afterId)
    // Dispatch first: the optimistic cache patch lands before the local drag state is dropped.
    if (changed) void moveIssue({ id, status: after.status, after_id: after.afterId })
    setDragColumns(null)
    setActiveId(null)
  }

  const onDragCancel = () => {
    startColumns.current = null
    setDragColumns(null)
    setActiveId(null)
  }

  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isLoading || !board) {
    return (
      <div className="flex gap-4 overflow-hidden" aria-busy>
        {STATUSES.map((s) => (
          <Skeleton key={s} className="h-96 w-[280px] shrink-0 rounded-[22px] xl:flex-1" />
        ))}
      </div>
    )
  }

  const active = activeId === null ? undefined : issues.get(activeId)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t('dnd.instructions') } }}
      >
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={columns[status].map((id) => issues.get(id)).filter((i) => i !== undefined)}
              canMove={canMove}
              onOpen={onOpen}
              onAdd={setCreateIn}
            />
          ))}
        </div>
        <DragOverlay>{active ? <IssueCardBody issue={active} dragging /> : null}</DragOverlay>
      </DndContext>
      {createIn ? (
        <IssueFormDialog open initialStatus={createIn} projectId={params.project_id ?? undefined} onClose={() => setCreateIn(null)} />
      ) : null}
    </>
  )
}
