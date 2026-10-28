import { STATUSES, type Status } from '@/lib/enums'
import type { Board, Issue } from '@/types/api'

/** Column → ordered issue ids, the local model the drag-and-drop works on. */
export type ColumnIds = Record<Status, number[]>

/** dnd-kit identifiers: issue ids (number) or column droppables (string). */
export type UniqueId = string | number

export const COLUMN_PREFIX = 'column:'

export function columnDroppableId(status: Status): string {
  return `${COLUMN_PREFIX}${status}`
}

export function toColumnIds(board: Board | undefined): ColumnIds {
  const result = Object.fromEntries(STATUSES.map((s) => [s, [] as number[]])) as ColumnIds
  if (!board) return result
  for (const status of STATUSES) result[status] = board[status].map((i) => i.id)
  return result
}

export function indexIssues(board: Board | undefined): Map<number, Issue> {
  const map = new Map<number, Issue>()
  if (!board) return map
  for (const status of STATUSES) for (const issue of board[status]) map.set(issue.id, issue)
  return map
}

/** Which column holds an id (an issue id or a `column:<status>` droppable id). */
export function findColumn(columns: ColumnIds, id: string | number): Status | null {
  if (typeof id === 'string' && id.startsWith(COLUMN_PREFIX)) {
    const status = id.slice(COLUMN_PREFIX.length)
    return (STATUSES as readonly string[]).includes(status) ? (status as Status) : null
  }
  const numeric = Number(id)
  return STATUSES.find((s) => columns[s].includes(numeric)) ?? null
}

/**
 * Moves `activeId` into the column of `overId`, before the card it is over
 * (or at the end when over the empty column area). Returns a new object.
 */
export function moveBetween(columns: ColumnIds, activeId: number, overId: UniqueId): ColumnIds {
  const from = findColumn(columns, activeId)
  const to = findColumn(columns, overId)
  if (!from || !to) return columns

  const next: ColumnIds = { ...columns, [from]: columns[from].filter((id) => id !== activeId) }
  const target = [...next[to]]
  const overIndex = typeof overId === 'number' ? target.indexOf(overId) : -1
  target.splice(overIndex >= 0 ? overIndex : target.length, 0, activeId)
  next[to] = target
  return next
}

/** Reorders inside one column (dnd-kit arrayMove semantics). */
export function reorderWithin(columns: ColumnIds, status: Status, activeId: number, overId: number): ColumnIds {
  const list = [...columns[status]]
  const from = list.indexOf(activeId)
  const to = list.indexOf(overId)
  if (from < 0 || to < 0 || from === to) return columns
  list.splice(from, 1)
  list.splice(to, 0, activeId)
  return { ...columns, [status]: list }
}

/** The API places a moved card directly below `after_id` (null = top of the column). */
export function afterIdFor(columns: ColumnIds, issueId: number): { status: Status; afterId: number | null } | null {
  const status = findColumn(columns, issueId)
  if (!status) return null
  const list = columns[status]
  const index = list.indexOf(issueId)
  return { status, afterId: index > 0 ? (list[index - 1] ?? null) : null }
}
